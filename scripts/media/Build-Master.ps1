[CmdletBinding()]
param(
    [string]$GeneratedRoot,
    [switch]$IncludeMobile,
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
$masterDirectory = Ensure-MediaDirectory -Path (Join-Path $GeneratedRoot "master")
$framesDirectory = Join-Path $GeneratedRoot "frames"

function Get-TimelineClips {
    param(
        [string]$Suffix
    )

    $names = @(
        [pscustomobject]@{ Group = "scenes"; Stem = "scene01_dol_ai_lab" },
        [pscustomobject]@{ Group = "transitions"; Stem = "transition_01_to_02" },
        [pscustomobject]@{ Group = "scenes"; Stem = "scene02_draconis" },
        [pscustomobject]@{ Group = "transitions"; Stem = "transition_02_to_03" },
        [pscustomobject]@{ Group = "scenes"; Stem = "scene03_data_map" },
        [pscustomobject]@{ Group = "transitions"; Stem = "transition_03_to_04" },
        [pscustomobject]@{ Group = "scenes"; Stem = "scene04_dolsoe" },
        [pscustomobject]@{ Group = "transitions"; Stem = "transition_04_to_05" },
        [pscustomobject]@{ Group = "scenes"; Stem = "scene05_services" }
    )

    $clips = New-Object System.Collections.Generic.List[string]
    foreach ($name in $names) {
        $path = Join-Path (Join-Path $GeneratedRoot $name.Group) ($name.Stem + $Suffix + ".mp4")
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
            throw @"
Missing normalized timeline clip:
  $path
Build-Master.ps1 only concatenates real normalized renders. Run Normalize-Media.ps1
after downloading all Higgsfield scene and transition clips.
"@
        }
        $clips.Add((Resolve-Path -LiteralPath $path).Path)
    }

    return @($clips)
}

function New-EndingClip {
    param(
        [string]$Variant,
        [string]$SourceClip,
        [int]$Width,
        [int]$Height,
        [int]$Crf,
        [int]$Gop,
        [string]$Level,
        [string]$OutputPath
    )

    $boundaryDirectory = Ensure-MediaDirectory -Path (Join-Path $framesDirectory "$Variant\scenes")
    $lastFrame = Join-Path $boundaryDirectory "scene05_services_last.png"
    Export-ExactVideoFrame `
        -Ffmpeg $ffmpeg `
        -Ffprobe $ffprobe `
        -InputPath $SourceClip `
        -OutputPath $lastFrame `
        -Boundary "Last" `
        -Force:$Force

    if ((Test-Path -LiteralPath $OutputPath -PathType Leaf) -and -not $Force) {
        Write-Host "[ending] keeping existing $OutputPath"
        return
    }

    # The accessible high-contrast wordmark is rendered by EndSequence.tsx.
    # Keep the encoded ending clean so the former navy-on-navy bitmap cannot
    # show through beneath the live brand lockup.
    $filter = "[0:v]scale=${Width}:${Height}:force_original_aspect_ratio=decrease:flags=lanczos," +
        "pad=${Width}:${Height}:(ow-iw)/2:(oh-ih)/2:color=0x071426," +
        "fade=t=out:st=0:d=2.0:color=0x071426,format=yuv420p[out]"

    Invoke-MediaCommand -Executable $ffmpeg -Label "build $Variant ending" -Arguments @(
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-loop", "1",
        "-framerate", "30",
        "-t", "3",
        "-i", $lastFrame,
        "-filter_complex", $filter,
        "-map", "[out]",
        "-an",
        "-t", "3",
        "-r", "30",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", $Crf.ToString(),
        "-profile:v", "high",
        "-level:v", $Level,
        "-pix_fmt", "yuv420p",
        "-g", $Gop.ToString(),
        "-keyint_min", $Gop.ToString(),
        "-sc_threshold", "0",
        "-color_primaries", "bt709",
        "-color_trc", "bt709",
        "-colorspace", "bt709",
        "-movflags", "+faststart",
        $OutputPath
    )
}

function Join-Timeline {
    param(
        [string]$Variant,
        [string[]]$Clips,
        [string]$EndingClip,
        [int]$Crf,
        [int]$Gop,
        [string]$Level,
        [string]$Mp4Path,
        [string]$WebmPath
    )

    if ((Test-Path -LiteralPath $Mp4Path -PathType Leaf) -and
        (Test-Path -LiteralPath $WebmPath -PathType Leaf) -and
        -not $Force) {
        Write-Host "[master] keeping existing $Mp4Path and $WebmPath"
        return
    }

    $allClips = @($Clips) + @($EndingClip)
    $arguments = New-Object System.Collections.Generic.List[string]
    $arguments.Add("-hide_banner")
    $arguments.Add("-loglevel")
    $arguments.Add("error")
    $arguments.Add("-y")
    foreach ($clip in $allClips) {
        $arguments.Add("-i")
        $arguments.Add($clip)
    }

    $filterParts = New-Object System.Collections.Generic.List[string]
    $concatLabels = ""
    for ($index = 0; $index -lt $allClips.Count; $index++) {
        if ($index -eq 0) {
            $filterParts.Add("[$index`:v]setpts=PTS-STARTPTS[v$index]")
        }
        else {
            # Every chained clip starts on its predecessor's boundary frame.
            # Drop that one duplicate frame from the master while keeping the
            # individual files untouched for Scroll World seam crossfades.
            $filterParts.Add("[$index`:v]trim=start_frame=1,setpts=PTS-STARTPTS[v$index]")
        }
        $concatLabels += "[v$index]"
    }
    $filterParts.Add("$concatLabels" + "concat=n=$($allClips.Count):v=1:a=0[outv]")

    $arguments.Add("-filter_complex")
    $arguments.Add(($filterParts -join ";"))
    $arguments.Add("-map")
    $arguments.Add("[outv]")
    $arguments.Add("-an")
    $arguments.Add("-r")
    $arguments.Add("30")
    $arguments.Add("-c:v")
    $arguments.Add("libx264")
    $arguments.Add("-preset")
    $arguments.Add("slow")
    $arguments.Add("-crf")
    $arguments.Add($Crf.ToString())
    $arguments.Add("-profile:v")
    $arguments.Add("high")
    $arguments.Add("-level:v")
    $arguments.Add($Level)
    $arguments.Add("-pix_fmt")
    $arguments.Add("yuv420p")
    $arguments.Add("-g")
    $arguments.Add($Gop.ToString())
    $arguments.Add("-keyint_min")
    $arguments.Add($Gop.ToString())
    $arguments.Add("-sc_threshold")
    $arguments.Add("0")
    $arguments.Add("-color_primaries")
    $arguments.Add("bt709")
    $arguments.Add("-color_trc")
    $arguments.Add("bt709")
    $arguments.Add("-colorspace")
    $arguments.Add("bt709")
    $arguments.Add("-movflags")
    $arguments.Add("+faststart")
    $arguments.Add($Mp4Path)

    Invoke-MediaCommand -Executable $ffmpeg -Label "build $Variant MP4 master" -Arguments @($arguments)

    Invoke-MediaCommand -Executable $ffmpeg -Label "build $Variant WebM master" -Arguments @(
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", $Mp4Path,
        "-map", "0:v:0",
        "-an",
        "-c:v", "libvpx-vp9",
        "-b:v", "0",
        "-crf", $(if ($Variant -eq "mobile") { "34" } else { "30" }),
        "-deadline", "good",
        "-cpu-used", "2",
        "-row-mt", "1",
        "-tile-columns", "2",
        # Keep the WebM as seekable as the H.264 master. The browser prefers
        # WebM on supported desktop browsers, so a long default-style VP9 GOP
        # would make scroll scrubbing jump between distant keyframes.
        "-g", $Gop.ToString(),
        $WebmPath
    )
}

$desktopClips = Get-TimelineClips -Suffix ""
$desktopEnding = Join-Path $masterDirectory "_ending-desktop.mp4"
New-EndingClip `
    -Variant "desktop" `
    -SourceClip $desktopClips[-1] `
    -Width 1920 `
    -Height 1080 `
    -Crf 24 `
    -Gop 8 `
    -Level "4.1" `
    -OutputPath $desktopEnding

Join-Timeline `
    -Variant "desktop" `
    -Clips $desktopClips `
    -EndingClip $desktopEnding `
    -Crf 24 `
    -Gop 8 `
    -Level "4.1" `
    -Mp4Path (Join-Path $masterDirectory "dol-ai-lab-scroll.mp4") `
    -WebmPath (Join-Path $masterDirectory "dol-ai-lab-scroll.webm")

if ($IncludeMobile) {
    $mobileClips = Get-TimelineClips -Suffix "-mobile"
    $mobileEnding = Join-Path $masterDirectory "_ending-mobile.mp4"
    New-EndingClip `
        -Variant "mobile" `
        -SourceClip $mobileClips[-1] `
        -Width 720 `
        -Height 1280 `
        -Crf 23 `
        -Gop 4 `
        -Level "4.0" `
        -OutputPath $mobileEnding

    Join-Timeline `
        -Variant "mobile" `
        -Clips $mobileClips `
        -EndingClip $mobileEnding `
        -Crf 23 `
        -Gop 4 `
        -Level "4.0" `
        -Mp4Path (Join-Path $masterDirectory "dol-ai-lab-scroll-mobile.mp4") `
        -WebmPath (Join-Path $masterDirectory "dol-ai-lab-scroll-mobile.webm")
}

Write-Host "Master media is available under: $masterDirectory"
