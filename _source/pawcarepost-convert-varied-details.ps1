$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$map = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'pawcarepost-varied-detail-map.json') -Raw | ConvertFrom-Json
$articles = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'pawcarepost-articles.json') -Raw | ConvertFrom-Json
$sourceRoot = 'C:\Users\WIM\.codex\generated_images\01a0e60b-f9b8-7470-a865-d306a83a7702'
$outputRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'assets\images\articles'

foreach ($article in $articles) {
    $slug = $article.slug
    $sourceName = $map.$slug
    if (-not $sourceName) { throw "Missing generated detail mapping: $slug" }
    if (-not (Test-Path -LiteralPath (Join-Path $sourceRoot $sourceName))) { throw "Missing generated detail image: $sourceName" }
}

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$parameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
$parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]84)
$count = 0
foreach ($article in $articles) {
    $slug = $article.slug
    $bitmap = [System.Drawing.Image]::FromFile((Join-Path $sourceRoot $map.$slug))
    try { $bitmap.Save((Join-Path $outputRoot ($slug + '-detail.jpg')), $codec, $parameters) }
    finally { $bitmap.Dispose() }
    $count++
}
Write-Output "Converted $count varied detail images."
