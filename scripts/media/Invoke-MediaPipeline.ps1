[CmdletBinding()]
param(
    [string]$InputRoot,
    [string]$GeneratedRoot,
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
if ([string]::IsNullOrWhiteSpace($GeneratedRoot)) {
    $GeneratedRoot = Join-Path $projectRoot "public\generated"
}

if ($IncludeMobile) {
    $canvasDirectory = Join-Path $GeneratedRoot "frames\mobile\canvases"
    $missingCanvases = @(
        foreach ($stem in Get-MediaSceneNames) {
            $canvasPath = Join-Path $canvasDirectory ($stem + "_canvas.png")
            if (-not (Test-Path -LiteralPath $canvasPath -PathType Leaf)) {
                $canvasPath
            }
        }
    )

    if ($missingCanvases.Count -gt 0) {
        Write-Host "[portrait canvas] creating $($missingCanvases.Count) missing canvas file(s)"
        # Intentionally do not forward -Force. These files may be hand-composed
        # native portrait seeds that were already used for generation, and the
        # final normalization pass must never replace that provenance.
        & (Join-Path $PSScriptRoot "New-PortraitCanvases.ps1") `
            -OutputDirectory $canvasDirectory
    }
    else {
        Write-Host "[portrait canvas] all expected canvases already exist; preserving them"
    }
}

& (Join-Path $PSScriptRoot "Normalize-Media.ps1") `
    -InputRoot $InputRoot `
    -OutputRoot $GeneratedRoot `
    -MediaKind "All" `
    -IncludeMobile:$IncludeMobile `
    -Force:$Force

& (Join-Path $PSScriptRoot "Extract-BoundaryFrames.ps1") `
    -GeneratedRoot $GeneratedRoot `
    -Variant "Desktop" `
    -MediaKind "Scenes" `
    -Force:$Force

if ($IncludeMobile) {
    & (Join-Path $PSScriptRoot "Extract-BoundaryFrames.ps1") `
        -GeneratedRoot $GeneratedRoot `
        -Variant "Mobile" `
        -MediaKind "Scenes" `
        -Force:$Force
}

& (Join-Path $PSScriptRoot "Lock-TransitionEndpoints.ps1") `
    -GeneratedRoot $GeneratedRoot `
    -Variant "Desktop" `
    -Force:$Force

if ($IncludeMobile) {
    & (Join-Path $PSScriptRoot "Lock-TransitionEndpoints.ps1") `
        -GeneratedRoot $GeneratedRoot `
        -Variant "Mobile" `
        -Force:$Force
}

& (Join-Path $PSScriptRoot "Extract-BoundaryFrames.ps1") `
    -GeneratedRoot $GeneratedRoot `
    -Variant "Desktop" `
    -MediaKind "Transitions" `
    -Force:$Force

if ($IncludeMobile) {
    & (Join-Path $PSScriptRoot "Extract-BoundaryFrames.ps1") `
        -GeneratedRoot $GeneratedRoot `
        -Variant "Mobile" `
        -MediaKind "Transitions" `
        -Force:$Force
}

& (Join-Path $PSScriptRoot "Build-Master.ps1") `
    -GeneratedRoot $GeneratedRoot `
    -IncludeMobile:$IncludeMobile `
    -Force:$Force

& (Join-Path $PSScriptRoot "Export-MediaQa.ps1") `
    -GeneratedRoot $GeneratedRoot `
    -IncludeMobile:$IncludeMobile `
    -FailOnIssue

Write-Host "DOL AI LAB media pipeline completed."
