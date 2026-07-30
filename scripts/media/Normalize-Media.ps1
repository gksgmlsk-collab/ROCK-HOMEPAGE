[CmdletBinding()]
param(
    [string]$InputRoot,
    [string]$OutputRoot,

    [ValidateSet("Scenes", "Transitions", "All")]
    [string]$MediaKind = "All",

    [switch]$IncludeMobile,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Common.ps1")

$projectRoot = Get-MediaProjectRoot
if ([string]::IsNullOrWhiteSpace($InputRoot)) {
    $InputRoot = Join-Path $projectRoot "generation\renders"
}
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $projectRoot "public\generated"
}

$ffmpeg = Resolve-MediaExecutable -ToolName "ffmpeg"
$ffprobe = Resolve-MediaExecutable -ToolName "ffprobe"
Initialize-MediaLayout -GeneratedRoot $OutputRoot

$profiles = @(
    [pscustomobject]@{
        Name = "desktop"
        Width = 1920
        Height = 1080
        Crf = 20
        Gop = 8
        Level = "4.1"
        Suffix = ""
    }
)
if ($IncludeMobile) {
    $profiles += [pscustomobject]@{
        Name = "mobile"
        Width = 720
        Height = 1280
        Crf = 23
        Gop = 4
        Level = "4.0"
        Suffix = "-mobile"
    }
}

$groups = New-Object System.Collections.Generic.List[object]
if ($MediaKind -eq "Scenes" -or $MediaKind -eq "All") {
    $groups.Add([pscustomobject]@{ Name = "scenes"; Stems = @(Get-MediaSceneNames) })
}
if ($MediaKind -eq "Transitions" -or $MediaKind -eq "All") {
    $groups.Add([pscustomobject]@{ Name = "transitions"; Stems = @(Get-MediaTransitionNames) })
}

foreach ($profile in $profiles) {
    foreach ($group in $groups) {
        $inputDirectory = Join-Path $InputRoot "$($profile.Name)\$($group.Name)"
        $outputDirectory = Ensure-MediaDirectory -Path (Join-Path $OutputRoot $group.Name)

        foreach ($stem in $group.Stems) {
            $inputPath = Resolve-RequiredInputClip -Directory $inputDirectory -Stem $stem
            $outputPath = Join-Path $outputDirectory ($stem + $profile.Suffix + ".mp4")
            $sourceDimensions = Get-VideoDimensions -Ffprobe $ffprobe -InputPath $inputPath

            if ($profile.Name -eq "mobile" -and $sourceDimensions.Width -ge $sourceDimensions.Height) {
                throw @"
The mobile source for '$stem' is $($sourceDimensions.Width)x$($sourceDimensions.Height), not native portrait.
This pipeline refuses to disguise a landscape render as the mobile version. Generate a
separate 9:16 Higgsfield chain from the portrait canvases, or omit -IncludeMobile.
"@
            }
            if ($profile.Name -eq "desktop" -and $sourceDimensions.Width -le $sourceDimensions.Height) {
                throw "The desktop source for '$stem' is not landscape: $($sourceDimensions.Width)x$($sourceDimensions.Height)."
            }

            if ((Test-Path -LiteralPath $outputPath -PathType Leaf) -and -not $Force) {
                Write-Host "[normalize] keeping existing $outputPath"
                continue
            }

            $videoFilter = "scale=$($profile.Width):$($profile.Height):force_original_aspect_ratio=decrease:flags=lanczos," +
                "pad=$($profile.Width):$($profile.Height):(ow-iw)/2:(oh-ih)/2:color=0x071426," +
                "setsar=1,fps=30,format=yuv420p"

            Invoke-MediaCommand -Executable $ffmpeg -Label "normalize $($profile.Name)/$stem" -Arguments @(
                "-hide_banner",
                "-loglevel", "error",
                "-y",
                "-i", $inputPath,
                "-map", "0:v:0",
                "-map_metadata", "-1",
                "-an",
                "-vf", $videoFilter,
                "-c:v", "libx264",
                "-preset", "slow",
                "-crf", $profile.Crf.ToString(),
                "-profile:v", "high",
                "-level:v", $profile.Level,
                "-pix_fmt", "yuv420p",
                "-g", $profile.Gop.ToString(),
                "-keyint_min", $profile.Gop.ToString(),
                "-sc_threshold", "0",
                "-color_primaries", "bt709",
                "-color_trc", "bt709",
                "-colorspace", "bt709",
                "-movflags", "+faststart",
                $outputPath
            )
        }
    }
}

Write-Host "Normalized media is available under: $OutputRoot"
