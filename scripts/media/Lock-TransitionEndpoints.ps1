[CmdletBinding()]
param(
    [string]$GeneratedRoot,

    [ValidateSet("Desktop", "Mobile")]
    [string]$Variant = "Desktop",

    [ValidateRange(1, 15)]
    [int]$BlendFrames = 8,

    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Common.ps1")

$projectRoot = Get-MediaProjectRoot
if ([string]::IsNullOrWhiteSpace($GeneratedRoot)) {
    $GeneratedRoot = Join-Path $projectRoot "public\generated"
}

$ffmpeg = Resolve-MediaExecutable -ToolName "ffmpeg"
$ffprobe = Resolve-MediaExecutable -ToolName "ffprobe"
Initialize-MediaLayout -GeneratedRoot $GeneratedRoot

$variantDirectory = $Variant.ToLowerInvariant()
$suffix = if ($Variant -eq "Mobile") { "-mobile" } else { "" }
$transitionDirectory = [IO.Path]::GetFullPath((Join-Path $GeneratedRoot "transitions"))
$sceneFrameDirectory = [IO.Path]::GetFullPath((Join-Path $GeneratedRoot "frames\$variantDirectory\scenes"))
$sceneNames = @(Get-MediaSceneNames)
$transitionNames = @(Get-MediaTransitionNames)
$marker = "DOL_AI_LAB_ENDPOINT_LOCK_V1"
$frameRate = 30.0
$blendDuration = $BlendFrames / $frameRate

for ($index = 0; $index -lt $transitionNames.Count; $index++) {
    $transitionPath = [IO.Path]::GetFullPath(
        (Join-Path $transitionDirectory ($transitionNames[$index] + $suffix + ".mp4"))
    )
    $startFrame = [IO.Path]::GetFullPath(
        (Join-Path $sceneFrameDirectory ($sceneNames[$index] + "_last.png"))
    )
    $endFrame = [IO.Path]::GetFullPath(
        (Join-Path $sceneFrameDirectory ($sceneNames[$index + 1] + "_first.png"))
    )

    foreach ($requiredPath in @($transitionPath, $startFrame, $endFrame)) {
        if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
            throw "Endpoint locking requires this real normalized clip/frame, but it is missing: $requiredPath"
        }
    }

    $existingMarker = Invoke-MediaCapture -Executable $ffprobe -Label "probe endpoint marker" -Arguments @(
        "-v", "error",
        "-show_entries", "format_tags=comment",
        "-of", "default=nokey=1:noprint_wrappers=1",
        $transitionPath
    )
    if (-not $Force -and $existingMarker.Trim() -eq $marker) {
        Write-Host "[endpoint lock] keeping already-locked $transitionPath"
        continue
    }

    $dimensions = Get-VideoDimensions -Ffprobe $ffprobe -InputPath $transitionPath
    foreach ($framePath in @($startFrame, $endFrame)) {
        $frameDimensions = Get-VideoDimensions -Ffprobe $ffprobe -InputPath $framePath
        if ($frameDimensions.Width -ne $dimensions.Width -or
            $frameDimensions.Height -ne $dimensions.Height) {
            throw "Boundary frame dimensions do not match '$transitionPath': $framePath"
        }
    }

    $frameCount = Get-VideoFrameCount -Ffprobe $ffprobe -InputPath $transitionPath
    if ($frameCount -le ($BlendFrames * 2 + 1)) {
        throw "Transition '$transitionPath' is too short for a $BlendFrames-frame endpoint lock."
    }

    $lastTimestamp = ($frameCount - 1) / $frameRate
    $endBlendStart = $lastTimestamp - $blendDuration
    $clipDuration = $frameCount / $frameRate
    $invariant = [Globalization.CultureInfo]::InvariantCulture
    $blendDurationText = $blendDuration.ToString("0.000000", $invariant)
    $endBlendStartText = $endBlendStart.ToString("0.000000", $invariant)
    $lastTimestampText = $lastTimestamp.ToString("0.000000", $invariant)
    $clipDurationText = $clipDuration.ToString("0.000000", $invariant)

    $filter = @"
[0:v]fps=30,trim=duration=$clipDurationText,setpts=PTS-STARTPTS[base];
[1:v]fps=30,trim=duration=$clipDurationText,format=yuv420p,setpts=PTS-STARTPTS[start];
[base][start]blend=all_expr='if(lte(T\,$blendDurationText)\,A*(T/$blendDurationText)+B*(1-T/$blendDurationText)\,A)'[v1];
[2:v]fps=30,trim=duration=$clipDurationText,format=yuv420p,setpts=PTS-STARTPTS[end];
[v1][end]blend=all_expr='if(gte(T\,$endBlendStartText)\,A*max(0\,min(1\,($lastTimestampText-T)/$blendDurationText))+B*(1-max(0\,min(1\,($lastTimestampText-T)/$blendDurationText)))\,A)'[out]
"@ -replace "\r?\n", ""

    $temporaryPath = [IO.Path]::GetFullPath(
        (Join-Path $transitionDirectory (".$($transitionNames[$index])$suffix.endpoint-lock.tmp.mp4"))
    )
    foreach ($candidate in @($transitionPath, $temporaryPath)) {
        if (-not $candidate.StartsWith(
            $transitionDirectory + [IO.Path]::DirectorySeparatorChar,
            [StringComparison]::OrdinalIgnoreCase
        )) {
            throw "Refusing to replace a file outside the normalized transition directory: $candidate"
        }
    }

    $gop = if ($Variant -eq "Mobile") { "4" } else { "8" }
    $crf = if ($Variant -eq "Mobile") { "23" } else { "20" }
    $level = if ($Variant -eq "Mobile") { "4.0" } else { "4.2" }

    try {
        Invoke-MediaCommand -Executable $ffmpeg -Label "lock $variantDirectory transition endpoints" -Arguments @(
            "-hide_banner",
            "-loglevel", "error",
            "-y",
            "-i", $transitionPath,
            "-loop", "1",
            "-framerate", "30",
            "-t", $clipDurationText,
            "-i", $startFrame,
            "-loop", "1",
            "-framerate", "30",
            "-t", $clipDurationText,
            "-i", $endFrame,
            "-filter_complex", $filter,
            "-map", "[out]",
            "-an",
            "-frames:v", $frameCount.ToString($invariant),
            "-c:v", "libx264",
            "-preset", "slow",
            "-crf", $crf,
            "-profile:v", "high",
            "-level:v", $level,
            "-pix_fmt", "yuv420p",
            "-g", $gop,
            "-keyint_min", $gop,
            "-sc_threshold", "0",
            "-movflags", "+faststart",
            "-metadata", "comment=$marker",
            $temporaryPath
        )

        if (-not (Test-Path -LiteralPath $temporaryPath -PathType Leaf)) {
            throw "FFmpeg returned success but did not create the endpoint-locked transition: $temporaryPath"
        }

        $lockedFrameCount = Get-VideoFrameCount -Ffprobe $ffprobe -InputPath $temporaryPath
        if ($lockedFrameCount -ne $frameCount) {
            throw "Endpoint lock changed the frame count for '$transitionPath' ($frameCount -> $lockedFrameCount)."
        }

        Move-Item -LiteralPath $temporaryPath -Destination $transitionPath -Force
        Write-Host "[endpoint lock] replaced derived transition with $BlendFrames-frame boundary blends: $transitionPath"
    }
    finally {
        if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) {
            Remove-Item -LiteralPath $temporaryPath -Force
        }
    }
}

Write-Host "Endpoint-locked $variantDirectory transitions are ready in: $transitionDirectory"
