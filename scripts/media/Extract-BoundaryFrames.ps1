[CmdletBinding()]
param(
    [string]$GeneratedRoot,

    [ValidateSet("Desktop", "Mobile")]
    [string]$Variant = "Desktop",

    [ValidateSet("Scenes", "Transitions", "All")]
    [string]$MediaKind = "All",

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
$groups = New-Object System.Collections.Generic.List[object]
if ($MediaKind -eq "Scenes" -or $MediaKind -eq "All") {
    $groups.Add([pscustomobject]@{ Name = "scenes"; Stems = @(Get-MediaSceneNames) })
}
if ($MediaKind -eq "Transitions" -or $MediaKind -eq "All") {
    $groups.Add([pscustomobject]@{ Name = "transitions"; Stems = @(Get-MediaTransitionNames) })
}

foreach ($group in $groups) {
    $inputDirectory = Join-Path $GeneratedRoot $group.Name
    $outputDirectory = Ensure-MediaDirectory -Path (Join-Path $GeneratedRoot "frames\$variantDirectory\$($group.Name)")

    foreach ($stem in $group.Stems) {
        $inputPath = Join-Path $inputDirectory ($stem + $suffix + ".mp4")
        if (-not (Test-Path -LiteralPath $inputPath -PathType Leaf)) {
            throw @"
Missing normalized $variantDirectory clip:
  $inputPath
Run Normalize-Media.ps1 after downloading the real Higgsfield render. No placeholder
frame was written.
"@
        }

        Export-ExactVideoFrame `
            -Ffmpeg $ffmpeg `
            -Ffprobe $ffprobe `
            -InputPath $inputPath `
            -OutputPath (Join-Path $outputDirectory ($stem + "_first.png")) `
            -Boundary "First" `
            -Force:$Force

        Export-ExactVideoFrame `
            -Ffmpeg $ffmpeg `
            -Ffprobe $ffprobe `
            -InputPath $inputPath `
            -OutputPath (Join-Path $outputDirectory ($stem + "_last.png")) `
            -Boundary "Last" `
            -Force:$Force
    }
}

Write-Host "Exact $variantDirectory boundary frames are available under: $(Join-Path $GeneratedRoot "frames\$variantDirectory")"
