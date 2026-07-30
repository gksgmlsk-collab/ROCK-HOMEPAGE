[CmdletBinding()]
param(
    [string]$AssetsRoot,
    [string]$OutputDirectory,
    [int]$Width = 720,
    [int]$Height = 1280,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Common.ps1")

$projectRoot = Get-MediaProjectRoot
if ([string]::IsNullOrWhiteSpace($AssetsRoot)) {
    $AssetsRoot = Join-Path $projectRoot "assets"
}
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $projectRoot "public\generated\frames\mobile\canvases"
}
if ($Width -lt 360 -or $Height -le $Width) {
    throw "Portrait canvas dimensions must be portrait and at least 360px wide. Received ${Width}x${Height}."
}

$ffmpeg = Resolve-MediaExecutable -ToolName "ffmpeg"
Ensure-MediaDirectory -Path $OutputDirectory | Out-Null

$sources = @(
    [pscustomobject]@{ Stem = "scene01_dol_ai_lab"; File = "scene1_dol_ai_lab.png" },
    [pscustomobject]@{ Stem = "scene02_draconis"; File = "scene2_draconis.png" },
    [pscustomobject]@{ Stem = "scene03_data_map"; File = "scene3_data_map.png" },
    [pscustomobject]@{ Stem = "scene04_dolsoe"; File = "scene4_awards_dolsoe.png" },
    [pscustomobject]@{ Stem = "scene05_services"; File = "scene5_services.png" }
)

$foregroundWidth = [Math]::Max(320, $Width - 32)
$foregroundHeight = [Math]::Max(640, $Height - 80)

foreach ($source in $sources) {
    $inputPath = Join-Path $AssetsRoot $source.File
    if (-not (Test-Path -LiteralPath $inputPath -PathType Leaf)) {
        throw "Missing source artwork for portrait canvas: $inputPath"
    }

    $outputPath = Join-Path $OutputDirectory ($source.Stem + "_canvas.png")
    if ((Test-Path -LiteralPath $outputPath -PathType Leaf) -and -not $Force) {
        Write-Host "[portrait canvas] keeping existing $outputPath"
        continue
    }

    $filter = "[0:v]split=2[bgsrc][fgsrc];" +
        "[bgsrc]scale=${Width}:${Height}:force_original_aspect_ratio=increase:flags=lanczos," +
        "crop=${Width}:${Height},gblur=sigma=36,eq=brightness=-0.18:saturation=0.72[bg];" +
        "[fgsrc]scale=${foregroundWidth}:${foregroundHeight}:force_original_aspect_ratio=decrease:flags=lanczos[fg];" +
        "[bg][fg]overlay=(W-w)/2:(H-h)/2,format=rgba[out]"

    Invoke-MediaCommand -Executable $ffmpeg -Label "portrait canvas $($source.Stem)" -Arguments @(
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", $inputPath,
        "-filter_complex", $filter,
        "-map", "[out]",
        "-frames:v", "1",
        $outputPath
    )
}

Write-Host "Portrait generation canvases are available under: $OutputDirectory"
