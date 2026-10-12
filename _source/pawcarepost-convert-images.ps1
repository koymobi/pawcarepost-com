$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$map = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'pawcarepost-image-map.json') -Raw | ConvertFrom-Json
$sourceRoot = 'C:\Users\WIM\.codex\generated_images'
$outputRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'assets\images\articles'
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$parameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
$parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]84)
foreach ($item in $map.PSObject.Properties) {
    $inputPath = Join-Path $sourceRoot $item.Value
    $outputPath = Join-Path $outputRoot ($item.Name + '.jpg')
    $bitmap = [System.Drawing.Image]::FromFile($inputPath)
    try { $bitmap.Save($outputPath, $codec, $parameters) }
    finally { $bitmap.Dispose() }
}
Write-Output "Converted $($map.PSObject.Properties.Count) article images."
