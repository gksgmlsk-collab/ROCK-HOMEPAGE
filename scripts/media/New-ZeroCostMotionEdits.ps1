[CmdletBinding()]
param(
    [switch]$ApplySceneFive,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Common.ps1")

$projectRoot = Get-MediaProjectRoot
$ffmpeg = Resolve-MediaExecutable -ToolName "ffmpeg"
$ffprobe = Resolve-MediaExecutable -ToolName "ffprobe"

$assetsDirectory = Join-Path $projectRoot "assets"
$motionDirectory = Join-Path $projectRoot "generation\renders\desktop\scenes-motion"
$sceneDirectory = Join-Path $projectRoot "generation\renders\desktop\scenes"
$transitionDirectory = Join-Path $projectRoot "generation\renders\desktop\transitions"
$localEditDirectory = Ensure-MediaDirectory -Path (
    Join-Path $projectRoot "generation\renders\desktop\local-edits"
)
$heroDirectory = Ensure-MediaDirectory -Path (
    Join-Path $projectRoot "public\generated\hero"
)

$sceneOneSource = Resolve-RequiredInputClip `
    -Directory $motionDirectory `
    -Stem "scene01_dol_ai_lab"

$introOutput = Join-Path $heroDirectory "dol-ai-lab-living-loop.mp4"
$sceneFiveArtwork = Join-Path $assetsDirectory "scene5_services.png"
$sceneFivePublicArtwork = Join-Path $projectRoot "public\assets\scene5_services.png"
$sceneFiveHiResCanvas = Join-Path $localEditDirectory "scene05_services_original_canvas_hires.png"
$sceneFiveOverviewFrame = Join-Path $localEditDirectory "scene05_services_original_overview.png"
$sceneFiveOutput = Join-Path $localEditDirectory "scene05_services_original_camera.mp4"
$sceneFiveMobileCanvas = Join-Path (
    Join-Path $projectRoot "public\generated\frames\mobile\canvases"
) "scene05_services_canvas.png"
$sceneFourLastFrame = Join-Path (
    Join-Path $projectRoot "public\generated\frames\desktop\scenes"
) "scene04_dolsoe_last.png"
$transitionFiveSource = Join-Path $transitionDirectory "transition_04_to_05.mp4"
$transitionFiveOutput = Join-Path $localEditDirectory "transition_04_to_05_original_artwork.mp4"

function Assert-LocalAsset {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required local asset is missing: $Path"
    }
}

foreach ($asset in @(
    $sceneFiveArtwork,
    $sceneFourLastFrame
)) {
    Assert-LocalAsset -Path $asset
}

function New-SceneFiveSourceCanvases {
    $shouldBuildHiRes = $Force -or
        -not (Test-Path -LiteralPath $sceneFiveHiResCanvas -PathType Leaf) -or
        (Get-Item -LiteralPath $sceneFiveHiResCanvas).LastWriteTimeUtc -lt
        (Get-Item -LiteralPath $sceneFiveArtwork).LastWriteTimeUtc

    if ($shouldBuildHiRes) {
        # The supplied artwork is the only semantic source. A soft enlargement
        # fills the 16:9 margins while the untouched 3:2 artwork remains fully
        # visible in the foreground.
        $hiResFilter = "[0:v]split=2[bgsrc][fgsrc];" +
            "[bgsrc]scale=3840:2160:force_original_aspect_ratio=increase:flags=lanczos," +
            "crop=3840:2160,gblur=sigma=54,eq=brightness=-0.17:saturation=0.78[bg];" +
            "[fgsrc]scale=3240:2160:flags=lanczos[fg];" +
            "[bg][fg]overlay=(W-w)/2:(H-h)/2,format=rgb24[out]"

        Invoke-MediaCommand -Executable $ffmpeg -Label "scene five original artwork canvas" -Arguments @(
            "-hide_banner",
            "-loglevel", "error",
            "-y",
            "-i", $sceneFiveArtwork,
            "-filter_complex", $hiResFilter,
            "-map", "[out]",
            "-frames:v", "1",
            $sceneFiveHiResCanvas
        )
    }
    else {
        Write-Host "[scene five canvas] keeping existing $sceneFiveHiResCanvas"
    }

    $shouldBuildOverview = $Force -or
        -not (Test-Path -LiteralPath $sceneFiveOverviewFrame -PathType Leaf) -or
        (Get-Item -LiteralPath $sceneFiveOverviewFrame).LastWriteTimeUtc -lt
        (Get-Item -LiteralPath $sceneFiveHiResCanvas).LastWriteTimeUtc

    if ($shouldBuildOverview) {
        Invoke-MediaCommand -Executable $ffmpeg -Label "scene five original overview" -Arguments @(
            "-hide_banner",
            "-loglevel", "error",
            "-y",
            "-i", $sceneFiveHiResCanvas,
            "-vf", "scale=1920:1080:flags=lanczos,format=rgb24",
            "-frames:v", "1",
            $sceneFiveOverviewFrame
        )
    }
    else {
        Write-Host "[scene five overview] keeping existing $sceneFiveOverviewFrame"
    }
}

function New-SceneFivePortraitCanvas {
    Ensure-MediaDirectory -Path (Split-Path -Parent $sceneFiveMobileCanvas) | Out-Null

    $shouldBuild = $Force -or
        -not (Test-Path -LiteralPath $sceneFiveMobileCanvas -PathType Leaf) -or
        (Get-Item -LiteralPath $sceneFiveMobileCanvas).LastWriteTimeUtc -lt
        (Get-Item -LiteralPath $sceneFiveArtwork).LastWriteTimeUtc
    if (-not $shouldBuild) {
        Write-Host "[portrait canvas] keeping existing $sceneFiveMobileCanvas"
        return
    }

    $filter = "[0:v]split=2[bgsrc][fgsrc];" +
        "[bgsrc]scale=720:1280:force_original_aspect_ratio=increase:flags=lanczos," +
        "crop=720:1280,gblur=sigma=36,eq=brightness=-0.18:saturation=0.72[bg];" +
        "[fgsrc]scale=688:1200:force_original_aspect_ratio=decrease:flags=lanczos[fg];" +
        "[bg][fg]overlay=(W-w)/2:(H-h)/2,format=rgba[out]"

    Invoke-MediaCommand -Executable $ffmpeg -Label "portrait canvas scene five original" -Arguments @(
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", $sceneFiveArtwork,
        "-filter_complex", $filter,
        "-map", "[out]",
        "-frames:v", "1",
        $sceneFiveMobileCanvas
    )
}

function New-LocalMotionClip {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,

        [Parameter(Mandatory = $true)]
        [string]$InputPath,

        [Parameter(Mandatory = $true)]
        [string]$OutputPath,

        [Parameter(Mandatory = $true)]
        [string]$Filter,

        [string]$Duration,

        [int]$Crf = 20,

        [switch]$LoopImage
    )

    if ((Test-Path -LiteralPath $OutputPath -PathType Leaf) -and -not $Force) {
        Write-Host "[$Label] keeping existing $OutputPath"
        return
    }

    $inputArguments = @()
    if ($LoopImage) {
        $inputArguments = @("-loop", "1", "-framerate", "30", "-t", "6")
    }

    $arguments = @(
        "-hide_banner",
        "-loglevel", "error",
        "-y"
    ) + $inputArguments + @(
        "-i", $InputPath,
        "-filter_complex", $Filter,
        "-map", "[out]",
        "-an"
    )
    if (-not [string]::IsNullOrWhiteSpace($Duration)) {
        $arguments += @("-t", $Duration)
    }
    $arguments += @(
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", $Crf.ToString(),
        "-profile:v", "high",
        "-level:v", "4.1",
        "-pix_fmt", "yuv420p",
        "-g", "8",
        "-keyint_min", "8",
        "-sc_threshold", "0",
        "-color_primaries", "bt709",
        "-color_trc", "bt709",
        "-colorspace", "bt709",
        "-movflags", "+faststart",
        $OutputPath
    )

    Invoke-MediaCommand `
        -Executable $ffmpeg `
        -Label $Label `
        -Arguments $arguments
}

New-SceneFiveSourceCanvases
Ensure-MediaDirectory -Path (Split-Path -Parent $sceneFivePublicArtwork) | Out-Null
Copy-Item -LiteralPath $sceneFiveArtwork -Destination $sceneFivePublicArtwork -Force
New-SceneFivePortraitCanvas

# A 3.1-second ping-pong loop uses the lively opening only. The final reverse
# frame stops just before frame zero, so the browser loop boundary is clean.
$introFilter = "[0:v]trim=start=0:end=1.6,setpts=PTS-STARTPTS," +
    "fps=30,format=yuv420p[forward];" +
    "[0:v]trim=start=0.033:end=1.567,setpts=PTS-STARTPTS,reverse," +
    "fps=30,format=yuv420p[return];" +
    "[forward][return]concat=n=2:v=1:a=0,setsar=1[out]"

New-LocalMotionClip `
    -Label "zero-credit intro loop" `
    -InputPath $sceneOneSource `
    -OutputPath $introOutput `
    -Filter $introFilter

# Camera-only motion over the exact user-supplied pixels. No generated or
# redrawn text is introduced: overview -> teacher -> family -> gate -> overview.
$sceneFiveFilter = "[0:v]split=5[o0][a0][b0][c0][d0];" +
    "[o0]trim=duration=0.9,setpts=PTS-STARTPTS," +
    "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[o];" +
    "[a0]trim=duration=1.35,setpts=PTS-STARTPTS," +
    "crop=2304:1296:x='90+18*t':y='180+4*t'," +
    "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[a];" +
    "[b0]trim=duration=1.35,setpts=PTS-STARTPTS," +
    "crop=2112:1188:x='880+16*t':y=210," +
    "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[b];" +
    "[c0]trim=duration=1.35,setpts=PTS-STARTPTS," +
    "crop=2112:1188:x='1660+14*t':y=180," +
    "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[c];" +
    "[d0]trim=duration=0.85,setpts=PTS-STARTPTS," +
    "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[d];" +
    "[o][a]xfade=transition=fade:duration=0.18:offset=0.72[oa];" +
    "[oa][b]xfade=transition=smoothleft:duration=0.18:offset=1.89[oab];" +
    "[oab][c]xfade=transition=smoothleft:duration=0.18:offset=3.06[oabc];" +
    "[oabc][d]xfade=transition=fade:duration=0.18:offset=4.23," +
    "unsharp=5:5:0.35:5:5:0.0,setsar=1[out]"

New-LocalMotionClip `
    -Label "zero-credit scene five original-artwork camera edit" `
    -InputPath $sceneFiveHiResCanvas `
    -OutputPath $sceneFiveOutput `
    -Filter $sceneFiveFilter `
    -Duration "5" `
    -Crf 18 `
    -LoopImage

# Do not reuse the historic generated 04->05 clip: it contains synthetic Korean
# from its first frame. This local bridge crossfades the exact scene-four
# boundary frame into the exact original-artwork overview.
$transitionFiveFilter = "[0:v]scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos," +
    "crop=1920:1080,setsar=1,fps=30,format=yuv420p[left];" +
    "[1:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p[right];" +
    "[left][right]xfade=transition=fade:duration=1.35:offset=1.3," +
    "trim=duration=4,setpts=PTS-STARTPTS,setsar=1[out]"

Invoke-MediaCommand -Executable $ffmpeg -Label "zero-credit transition five original artwork" -Arguments @(
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-loop", "1",
    "-framerate", "30",
    "-t", "4",
    "-i", $sceneFourLastFrame,
    "-loop", "1",
    "-framerate", "30",
    "-t", "4",
    "-i", $sceneFiveOverviewFrame,
    "-filter_complex", $transitionFiveFilter,
    "-map", "[out]",
    "-an",
    "-t", "4",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "18",
    "-profile:v", "high",
    "-level:v", "4.2",
    "-pix_fmt", "yuv420p",
    "-g", "8",
    "-keyint_min", "8",
    "-sc_threshold", "0",
    "-movflags", "+faststart",
    $transitionFiveOutput
)

if ($ApplySceneFive) {
    $activeSceneFive = Join-Path $sceneDirectory "scene05_services.mp4"
    Copy-Item -LiteralPath $sceneFiveOutput -Destination $activeSceneFive -Force
    Write-Host "[activate] scene five original-artwork edit -> $activeSceneFive"

    Copy-Item -LiteralPath $transitionFiveOutput -Destination $transitionFiveSource -Force
    Write-Host "[activate] transition four-to-five original-artwork bridge -> $transitionFiveSource"
}

$introProbe = Get-VideoDimensions -Ffprobe $ffprobe -InputPath $introOutput
$sceneFiveProbe = Get-VideoDimensions -Ffprobe $ffprobe -InputPath $sceneFiveOutput
Write-Host "[verify] intro $($introProbe.Width)x$($introProbe.Height)"
Write-Host "[verify] scene five $($sceneFiveProbe.Width)x$($sceneFiveProbe.Height)"
Write-Host "Higgsfield jobs submitted: 0. Charged credits: 0."
