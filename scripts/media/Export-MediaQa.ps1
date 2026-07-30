[CmdletBinding()]
param(
    [string]$GeneratedRoot,
    [string]$OutputPath,
    [switch]$IncludeMobile,
    [switch]$FailOnIssue
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Common.ps1")

$projectRoot = Get-MediaProjectRoot
if ([string]::IsNullOrWhiteSpace($GeneratedRoot)) {
    $GeneratedRoot = Join-Path $projectRoot "public\generated"
}
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $GeneratedRoot "master\media-qa.json"
}

$ffmpeg = Resolve-MediaExecutable -ToolName "ffmpeg"
$ffprobe = Resolve-MediaExecutable -ToolName "ffprobe"
Initialize-MediaLayout -GeneratedRoot $GeneratedRoot
Ensure-MediaDirectory -Path (Split-Path -Parent $OutputPath) | Out-Null

function Get-ProbeProperty {
    param(
        [AllowNull()]
        [object]$InputObject,
        [string]$Name
    )

    if ($null -eq $InputObject) {
        return $null
    }
    $property = $InputObject.PSObject.Properties[$Name]
    if ($null -eq $property) {
        return $null
    }
    return $property.Value
}

function Get-KeyframeStats {
    param(
        [string]$Path,
        [double]$DurationSeconds
    )

    $text = Invoke-MediaCapture -Executable $ffprobe -Label "probe keyframes $(Split-Path -Leaf $Path)" -Arguments @(
        "-v", "error",
        "-select_streams", "v:0",
        "-skip_frame", "nokey",
        "-show_entries", "frame=best_effort_timestamp_time",
        "-of", "csv=p=0",
        $Path
    )

    $times = New-Object System.Collections.Generic.List[double]
    foreach ($line in @($text -split "\r?\n")) {
        $candidate = ($line.Trim() -split ",")[0].Trim()
        if ([string]::IsNullOrWhiteSpace($candidate)) {
            continue
        }

        $timestamp = 0.0
        if ([double]::TryParse(
            $candidate,
            [Globalization.NumberStyles]::Float,
            [Globalization.CultureInfo]::InvariantCulture,
            [ref]$timestamp
        )) {
            $times.Add($timestamp)
        }
    }

    $orderedTimes = @($times | Sort-Object -Unique)
    if ($orderedTimes.Count -eq 0) {
        return [pscustomobject]@{
            count = 0
            maxGapSeconds = $DurationSeconds
        }
    }

    $maxGap = 0.0
    $previous = 0.0
    foreach ($timestamp in $orderedTimes) {
        $boundedTimestamp = [Math]::Min(
            [Math]::Max([double]$timestamp, 0.0),
            $DurationSeconds
        )
        $gap = $boundedTimestamp - $previous
        if ($gap -gt $maxGap) {
            $maxGap = $gap
        }
        if ($boundedTimestamp -gt $previous) {
            $previous = $boundedTimestamp
        }
    }

    $tailGap = $DurationSeconds - $previous
    if ($tailGap -gt $maxGap) {
        $maxGap = $tailGap
    }

    return [pscustomobject]@{
        count = $orderedTimes.Count
        maxGapSeconds = [Math]::Round($maxGap, 6)
    }
}

function Get-ProbeMetadata {
    param(
        [string]$Path,
        [int]$ExpectedWidth,
        [int]$ExpectedHeight,
        [string]$ExpectedCodec,
        [double]$ExpectedMinDuration,
        [double]$ExpectedMaxDuration,
        [double]$MaxKeyframeGapSeconds
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return [pscustomobject]@{
            path = $Path
            exists = $false
            issues = @("missing file")
        }
    }

    $json = Invoke-MediaCapture -Executable $ffprobe -Label "probe $(Split-Path -Leaf $Path)" -Arguments @(
        "-v", "error",
        "-show_streams",
        "-show_format",
        "-of", "json",
        $Path
    )
    $probe = $json | ConvertFrom-Json
    $videoStreams = @($probe.streams | Where-Object { $_.codec_type -eq "video" })
    $audioStreams = @($probe.streams | Where-Object { $_.codec_type -eq "audio" })
    $issues = New-Object System.Collections.Generic.List[string]

    if ($videoStreams.Count -ne 1) {
        $issues.Add("expected exactly one video stream; found $($videoStreams.Count)")
    }

    $video = if ($videoStreams.Count -gt 0) { $videoStreams[0] } else { $null }
    $widthValue = Get-ProbeProperty -InputObject $video -Name "width"
    $heightValue = Get-ProbeProperty -InputObject $video -Name "height"
    $frameRateValue = Get-ProbeProperty -InputObject $video -Name "avg_frame_rate"
    $pixelFormatValue = Get-ProbeProperty -InputObject $video -Name "pix_fmt"
    $codecValue = Get-ProbeProperty -InputObject $video -Name "codec_name"
    $width = if ($null -ne $widthValue) { [int]$widthValue } else { 0 }
    $height = if ($null -ne $heightValue) { [int]$heightValue } else { 0 }
    $fps = Convert-RationalToDouble -Value $frameRateValue
    $pixelFormat = if ($null -ne $pixelFormatValue) { $pixelFormatValue.ToString() } else { "" }
    $codec = if ($null -ne $codecValue) { $codecValue.ToString() } else { "" }

    if ($width -ne $ExpectedWidth -or $height -ne $ExpectedHeight) {
        $issues.Add("expected ${ExpectedWidth}x${ExpectedHeight}; found ${width}x${height}")
    }
    if ([Math]::Abs($fps - 30.0) -gt 0.01) {
        $issues.Add("expected 30 fps; found $fps")
    }
    if ($audioStreams.Count -gt 0) {
        $issues.Add("audio stream must be removed")
    }
    if ($pixelFormat -ne "yuv420p") {
        $issues.Add("expected yuv420p; found '$pixelFormat'")
    }
    if (-not [string]::IsNullOrWhiteSpace($ExpectedCodec) -and $codec -ne $ExpectedCodec) {
        $issues.Add("expected codec '$ExpectedCodec'; found '$codec'")
    }

    $duration = 0.0
    $formatObject = Get-ProbeProperty -InputObject $probe -Name "format"
    $durationValue = Get-ProbeProperty -InputObject $formatObject -Name "duration"
    if ($null -ne $durationValue) {
        [double]::TryParse(
            $durationValue.ToString(),
            [Globalization.NumberStyles]::Float,
            [Globalization.CultureInfo]::InvariantCulture,
            [ref]$duration
        ) | Out-Null
    }
    if ($duration -le 0) {
        $issues.Add("duration must be greater than zero")
    }
    else {
        if ($duration -lt $ExpectedMinDuration -or $duration -gt $ExpectedMaxDuration) {
            $issues.Add(
                "expected duration between $ExpectedMinDuration and $ExpectedMaxDuration seconds; found $duration"
            )
        }
    }

    $keyframes = $null
    if ($null -ne $video -and $duration -gt 0) {
        $keyframes = Get-KeyframeStats -Path $Path -DurationSeconds $duration
        if ($keyframes.count -lt 1) {
            $issues.Add("no decodable video keyframes were reported")
        }
        elseif ($MaxKeyframeGapSeconds -gt 0 -and
            $keyframes.maxGapSeconds -gt ($MaxKeyframeGapSeconds + 0.001)) {
            $issues.Add(
                "maximum keyframe gap must be <= $MaxKeyframeGapSeconds seconds for scrub seeking; found $($keyframes.maxGapSeconds)"
            )
        }
    }

    $bitRate = 0L
    $bitRateValue = Get-ProbeProperty -InputObject $formatObject -Name "bit_rate"
    if ($null -ne $bitRateValue) {
        [long]::TryParse($bitRateValue.ToString(), [ref]$bitRate) | Out-Null
    }

    $file = Get-Item -LiteralPath $Path
    return [pscustomobject]@{
        path = $Path
        exists = $true
        bytes = $file.Length
        bitRate = $bitRate
        sha256 = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
        durationSeconds = [Math]::Round($duration, 3)
        width = $width
        height = $height
        fps = [Math]::Round($fps, 3)
        codec = $codec
        pixelFormat = $pixelFormat
        colorSpace = $(Get-ProbeProperty -InputObject $video -Name "color_space")
        colorPrimaries = $(Get-ProbeProperty -InputObject $video -Name "color_primaries")
        colorTransfer = $(Get-ProbeProperty -InputObject $video -Name "color_transfer")
        audioStreams = $audioStreams.Count
        expectedDurationRangeSeconds = @($ExpectedMinDuration, $ExpectedMaxDuration)
        keyframeCount = if ($null -ne $keyframes) { $keyframes.count } else { 0 }
        maxKeyframeGapSeconds = if ($null -ne $keyframes) { $keyframes.maxGapSeconds } else { $null }
        scrubKeyframeGapTargetSeconds = $MaxKeyframeGapSeconds
        issues = $issues.ToArray()
    }
}

function Measure-FramePsnr {
    param(
        [string]$Label,
        [string]$LeftPath,
        [string]$RightPath
    )

    if (-not (Test-Path -LiteralPath $LeftPath -PathType Leaf) -or
        -not (Test-Path -LiteralPath $RightPath -PathType Leaf)) {
        return [pscustomobject]@{
            label = $Label
            left = $LeftPath
            right = $RightPath
            measured = $false
            psnr = $null
            pass = $false
            note = "boundary frame missing"
        }
    }

    $nullDevice = if ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT) { "NUL" } else { "/dev/null" }
    $output = Invoke-MediaCapture -Executable $ffmpeg -Label "PSNR $Label" -Arguments @(
        "-hide_banner",
        "-loglevel", "info",
        "-i", $LeftPath,
        "-i", $RightPath,
        "-lavfi", "[0:v][1:v]psnr",
        "-f", "null",
        $nullDevice
    )

    $psnrValue = $null
    if ($output -match "average:(inf|[0-9]+(?:\.[0-9]+)?)") {
        if ($Matches[1] -eq "inf") {
            $psnrValue = "infinity"
        }
        else {
            $parsed = 0.0
            [double]::TryParse(
                $Matches[1],
                [Globalization.NumberStyles]::Float,
                [Globalization.CultureInfo]::InvariantCulture,
                [ref]$parsed
            ) | Out-Null
            $psnrValue = [Math]::Round($parsed, 3)
        }
    }

    $passes = $false
    if ($psnrValue -eq "infinity") {
        $passes = $true
    }
    elseif ($null -ne $psnrValue) {
        $passes = [double]$psnrValue -ge 18.0
    }

    return [pscustomobject]@{
        label = $Label
        left = $LeftPath
        right = $RightPath
        measured = $null -ne $psnrValue
        psnr = $psnrValue
        pass = $passes
        note = "PSNR is a screening signal only; visually inspect composition at every seam."
    }
}

function Get-VariantFiles {
    param(
        [string]$Variant,
        [string]$Suffix,
        [int]$Width,
        [int]$Height
    )

    $files = New-Object System.Collections.Generic.List[object]
    $maxKeyframeGap = if ($Variant -eq "mobile") { 0.2 } else { 0.35 }
    foreach ($stem in Get-MediaSceneNames) {
        $files.Add([pscustomobject]@{
            Path = Join-Path $GeneratedRoot "scenes\$stem$Suffix.mp4"
            Width = $Width
            Height = $Height
            Codec = "h264"
            MinDuration = 4.75
            MaxDuration = 5.35
            MaxKeyframeGap = $maxKeyframeGap
        })
    }
    foreach ($stem in Get-MediaTransitionNames) {
        $files.Add([pscustomobject]@{
            Path = Join-Path $GeneratedRoot "transitions\$stem$Suffix.mp4"
            Width = $Width
            Height = $Height
            Codec = "h264"
            MinDuration = 3.75
            MaxDuration = 4.35
            MaxKeyframeGap = $maxKeyframeGap
        })
    }

    $masterSuffix = if ($Variant -eq "mobile") { "-mobile" } else { "" }
    $files.Add([pscustomobject]@{
        Path = Join-Path $GeneratedRoot "master\dol-ai-lab-scroll$masterSuffix.mp4"
        Width = $Width
        Height = $Height
        Codec = "h264"
        MinDuration = 43.4
        MaxDuration = 44.6
        MaxKeyframeGap = $maxKeyframeGap
    })
    $files.Add([pscustomobject]@{
        Path = Join-Path $GeneratedRoot "master\dol-ai-lab-scroll$masterSuffix.webm"
        Width = $Width
        Height = $Height
        Codec = "vp9"
        MinDuration = 43.4
        MaxDuration = 44.6
        MaxKeyframeGap = $maxKeyframeGap
    })
    return $files.ToArray()
}

function Get-VariantSeams {
    param(
        [string]$Variant
    )

    $frameRoot = Join-Path $GeneratedRoot "frames\$Variant"
    $seams = New-Object System.Collections.Generic.List[object]
    for ($index = 0; $index -lt 4; $index++) {
        $sceneA = (Get-MediaSceneNames)[$index]
        $sceneB = (Get-MediaSceneNames)[$index + 1]
        $transition = (Get-MediaTransitionNames)[$index]
        $seams.Add((Measure-FramePsnr `
            -Label "$sceneA -> $transition" `
            -LeftPath (Join-Path $frameRoot "scenes\$($sceneA)_last.png") `
            -RightPath (Join-Path $frameRoot "transitions\$($transition)_first.png")))
        $seams.Add((Measure-FramePsnr `
            -Label "$transition -> $sceneB" `
            -LeftPath (Join-Path $frameRoot "transitions\$($transition)_last.png") `
            -RightPath (Join-Path $frameRoot "scenes\$($sceneB)_first.png")))
    }
    return $seams.ToArray()
}

$variantSpecs = @(
    [pscustomobject]@{ Name = "desktop"; Suffix = ""; Width = 1920; Height = 1080 }
)
if ($IncludeMobile) {
    $variantSpecs += [pscustomobject]@{ Name = "mobile"; Suffix = "-mobile"; Width = 720; Height = 1280 }
}

$variantReports = New-Object System.Collections.Generic.List[object]
$allIssues = New-Object System.Collections.Generic.List[string]
foreach ($variant in $variantSpecs) {
    $metadata = New-Object System.Collections.Generic.List[object]
    foreach ($fileSpec in Get-VariantFiles `
        -Variant $variant.Name `
        -Suffix $variant.Suffix `
        -Width $variant.Width `
        -Height $variant.Height) {
        $item = Get-ProbeMetadata `
            -Path $fileSpec.Path `
            -ExpectedWidth $fileSpec.Width `
            -ExpectedHeight $fileSpec.Height `
            -ExpectedCodec $fileSpec.Codec `
            -ExpectedMinDuration $fileSpec.MinDuration `
            -ExpectedMaxDuration $fileSpec.MaxDuration `
            -MaxKeyframeGapSeconds $fileSpec.MaxKeyframeGap
        $metadata.Add($item)
        foreach ($issue in @($item.issues)) {
            $allIssues.Add("$($item.path): $issue")
        }
    }

    $seams = @(Get-VariantSeams -Variant $variant.Name)
    foreach ($seam in $seams) {
        if (-not $seam.pass) {
            $allIssues.Add("$($seam.label): seam PSNR check did not pass")
        }
    }

    $variantReports.Add([pscustomobject]@{
        name = $variant.Name
        expectedWidth = $variant.Width
        expectedHeight = $variant.Height
        files = $metadata.ToArray()
        seams = $seams
    })
}

$report = [pscustomobject]@{
    schemaVersion = 1
    generatedAtUtc = [DateTime]::UtcNow.ToString("o")
    project = "DOL AI LAB Scroll World"
    passed = $allIssues.Count -eq 0
    notes = @(
        "All media must be visually reviewed; metadata cannot detect character drift or changed Korean UI.",
        "A seam at 18-25 dB can still be compositionally correct because video detail shimmers.",
        "Mobile entries represent native 9:16 renders, never a center-crop fallback."
    )
    variants = $variantReports.ToArray()
    issues = $allIssues.ToArray()
}

$jsonOutput = $report | ConvertTo-Json -Depth 12
$utf8WithoutBom = New-Object Text.UTF8Encoding($false)
[IO.File]::WriteAllText($OutputPath, $jsonOutput + [Environment]::NewLine, $utf8WithoutBom)
Write-Host "QA metadata written to: $OutputPath"

if ($FailOnIssue -and $allIssues.Count -gt 0) {
    throw "Media QA found $($allIssues.Count) issue(s). Review $OutputPath."
}
