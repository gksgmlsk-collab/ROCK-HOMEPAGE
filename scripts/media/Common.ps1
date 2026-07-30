Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:MediaProjectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
$script:MediaSceneNames = @(
    "scene01_dol_ai_lab",
    "scene02_draconis",
    "scene03_data_map",
    "scene04_dolsoe",
    "scene05_services"
)
$script:MediaTransitionNames = @(
    "transition_01_to_02",
    "transition_02_to_03",
    "transition_03_to_04",
    "transition_04_to_05"
)

function Get-MediaProjectRoot {
    return $script:MediaProjectRoot
}

function Get-MediaSceneNames {
    return @($script:MediaSceneNames)
}

function Get-MediaTransitionNames {
    return @($script:MediaTransitionNames)
}

function Ensure-MediaDirectory {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }

    return [IO.Path]::GetFullPath($Path)
}

function Initialize-MediaLayout {
    param(
        [string]$GeneratedRoot = (Join-Path $script:MediaProjectRoot "public\generated")
    )

    $paths = @(
        $GeneratedRoot,
        (Join-Path $GeneratedRoot "scenes"),
        (Join-Path $GeneratedRoot "transitions"),
        (Join-Path $GeneratedRoot "master"),
        (Join-Path $GeneratedRoot "frames"),
        (Join-Path $GeneratedRoot "frames\desktop\scenes"),
        (Join-Path $GeneratedRoot "frames\desktop\transitions"),
        (Join-Path $GeneratedRoot "frames\mobile\scenes"),
        (Join-Path $GeneratedRoot "frames\mobile\transitions"),
        (Join-Path $GeneratedRoot "frames\mobile\canvases")
    )

    foreach ($path in $paths) {
        Ensure-MediaDirectory -Path $path | Out-Null
    }
}

function Resolve-MediaExecutable {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("ffmpeg", "ffprobe")]
        [string]$ToolName
    )

    $environmentName = if ($ToolName -eq "ffmpeg") { "FFMPEG_PATH" } else { "FFPROBE_PATH" }
    $override = [Environment]::GetEnvironmentVariable($environmentName)
    if (-not [string]::IsNullOrWhiteSpace($override)) {
        if (Test-Path -LiteralPath $override -PathType Leaf) {
            return (Resolve-Path -LiteralPath $override).Path
        }

        $overrideCommand = Get-Command $override -ErrorAction SilentlyContinue
        if ($null -ne $overrideCommand) {
            return $overrideCommand.Source
        }

        throw "${environmentName} points to '$override', but that executable does not exist."
    }

    $pathCommand = Get-Command $ToolName -ErrorAction SilentlyContinue
    if ($null -ne $pathCommand) {
        return $pathCommand.Source
    }

    $isWindows = [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
    $binaryName = if ($isWindows) { "$ToolName.exe" } else { $ToolName }
    $nodeModules = Join-Path $script:MediaProjectRoot "node_modules"
    $candidates = New-Object System.Collections.Generic.List[string]

    if ($ToolName -eq "ffmpeg") {
        $candidates.Add((Join-Path $nodeModules "ffmpeg-static\$binaryName"))
        $candidates.Add((Join-Path $nodeModules "@ffmpeg-installer\win32-x64\ffmpeg.exe"))
        $candidates.Add((Join-Path $nodeModules "@ffmpeg-installer\linux-x64\ffmpeg"))
        $candidates.Add((Join-Path $nodeModules ".bin\$binaryName"))
    }
    else {
        $candidates.Add((Join-Path $nodeModules "ffprobe-static\$binaryName"))
        $candidates.Add((Join-Path $nodeModules "ffprobe-static\bin\win32\x64\ffprobe.exe"))
        $candidates.Add((Join-Path $nodeModules "ffprobe-static\bin\linux\x64\ffprobe"))
        $candidates.Add((Join-Path $nodeModules "@ffprobe-installer\win32-x64\ffprobe.exe"))
        $candidates.Add((Join-Path $nodeModules "@ffprobe-installer\linux-x64\ffprobe"))
        $candidates.Add((Join-Path $nodeModules ".bin\$binaryName"))

        $ffmpegOverride = [Environment]::GetEnvironmentVariable("FFMPEG_PATH")
        if (-not [string]::IsNullOrWhiteSpace($ffmpegOverride) -and
            (Test-Path -LiteralPath $ffmpegOverride -PathType Leaf)) {
            $sibling = Join-Path (Split-Path -Parent $ffmpegOverride) $binaryName
            $candidates.Add($sibling)
        }
    }

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    $searched = ($candidates | ForEach-Object { "  - $_" }) -join [Environment]::NewLine
    throw @"
Unable to locate $ToolName. No media was generated or modified.
Set $environmentName to the full executable path, install $ToolName on PATH, or install
the matching local package (ffmpeg-static / ffprobe-static). Searched:
$searched
"@
}

function Invoke-MediaCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Executable,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [string]$Label = "media command"
    )

    Write-Host "[$Label] $([IO.Path]::GetFileName($Executable))"
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

function Invoke-MediaCapture {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Executable,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [string]$Label = "media probe"
    )

    # Windows PowerShell wraps native stderr as ErrorRecord objects and, with
    # ErrorActionPreference=Stop, can terminate even when the process succeeds.
    # Capture the diagnostic stream first, then judge the native exit code.
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $captured = & $Executable @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    $text = ($captured | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    if ($exitCode -ne 0) {
        throw "$Label failed with exit code $exitCode.`n$text"
    }

    return $text.Trim()
}

function Resolve-RequiredInputClip {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Directory,

        [Parameter(Mandatory = $true)]
        [string]$Stem
    )

    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
        throw "Required render directory is missing: $Directory"
    }

    $extensions = @(".mp4", ".mov", ".webm", ".mkv", ".m4v")
    $matches = New-Object System.Collections.Generic.List[string]
    foreach ($extension in $extensions) {
        $candidate = Join-Path $Directory ($Stem + $extension)
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            $matches.Add((Resolve-Path -LiteralPath $candidate).Path)
        }
    }

    if ($matches.Count -eq 0) {
        throw @"
Missing required generated clip '$Stem' in:
  $Directory
Expected one of: $($extensions -join ", ")
The script does not create placeholder media. Download the completed Higgsfield render
with this exact stem, then run the script again.
"@
    }

    if ($matches.Count -gt 1) {
        throw "Multiple source clips match '$Stem' in '$Directory': $($matches -join ", "). Keep exactly one."
    }

    return $matches[0]
}

function Get-VideoFrameCount {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Ffprobe,

        [Parameter(Mandatory = $true)]
        [string]$InputPath
    )

    $value = Invoke-MediaCapture -Executable $Ffprobe -Label "count frames" -Arguments @(
        "-v", "error",
        "-select_streams", "v:0",
        "-count_frames",
        "-show_entries", "stream=nb_read_frames",
        "-of", "default=nokey=1:noprint_wrappers=1",
        $InputPath
    )

    $count = 0L
    if (-not [long]::TryParse($value.Trim(), [ref]$count) -or $count -lt 1) {
        throw "ffprobe could not determine an exact frame count for '$InputPath' (value: '$value')."
    }

    return $count
}

function Get-VideoDimensions {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Ffprobe,

        [Parameter(Mandatory = $true)]
        [string]$InputPath
    )

    $value = Invoke-MediaCapture -Executable $Ffprobe -Label "probe dimensions" -Arguments @(
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0:s=x",
        $InputPath
    )

    if ($value -notmatch "^\s*(\d+)x(\d+)\s*$") {
        throw "ffprobe could not determine video dimensions for '$InputPath' (value: '$value')."
    }

    return [pscustomobject]@{
        Width = [int]$Matches[1]
        Height = [int]$Matches[2]
    }
}

function Export-ExactVideoFrame {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Ffmpeg,

        [Parameter(Mandatory = $true)]
        [string]$Ffprobe,

        [Parameter(Mandatory = $true)]
        [string]$InputPath,

        [Parameter(Mandatory = $true)]
        [string]$OutputPath,

        [ValidateSet("First", "Last")]
        [string]$Boundary,

        [switch]$Force
    )

    if (-not (Test-Path -LiteralPath $InputPath -PathType Leaf)) {
        throw "Cannot extract a frame because the clip is missing: $InputPath"
    }

    if ((Test-Path -LiteralPath $OutputPath -PathType Leaf) -and -not $Force) {
        Write-Host "[extract frame] keeping existing $OutputPath"
        return
    }

    Ensure-MediaDirectory -Path (Split-Path -Parent $OutputPath) | Out-Null
    $frameIndex = 0L
    if ($Boundary -eq "Last") {
        $frameIndex = (Get-VideoFrameCount -Ffprobe $Ffprobe -InputPath $InputPath) - 1
    }

    $select = "select=eq(n\,$frameIndex)"
    Invoke-MediaCommand -Executable $Ffmpeg -Label "extract $($Boundary.ToLowerInvariant()) frame" -Arguments @(
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", $InputPath,
        "-vf", $select,
        "-vsync", "0",
        "-frames:v", "1",
        $OutputPath
    )

    if (-not (Test-Path -LiteralPath $OutputPath -PathType Leaf)) {
        throw "FFmpeg returned success but did not create the expected frame: $OutputPath"
    }
}

function Convert-RationalToDouble {
    param(
        [AllowNull()]
        [object]$Value
    )

    if ($null -eq $Value) {
        return 0.0
    }

    $text = $Value.ToString()
    if ($text -match "^(-?\d+)/(\d+)$") {
        $denominator = [double]$Matches[2]
        if ($denominator -eq 0) {
            return 0.0
        }
        return [double]$Matches[1] / $denominator
    }

    $number = 0.0
    if ([double]::TryParse(
        $text,
        [Globalization.NumberStyles]::Float,
        [Globalization.CultureInfo]::InvariantCulture,
        [ref]$number
    )) {
        return $number
    }

    return 0.0
}
