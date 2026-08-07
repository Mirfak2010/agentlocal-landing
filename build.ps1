# Собирает single-file версию лендинга: CSS, JS и шрифты вшиваются в один HTML.
# Запуск:  powershell -ExecutionPolicy Bypass -File build.ps1
# Результат: dist\rezaru.html — самодостаточный файл, работает без интернета.

$ErrorActionPreference = 'Stop'
$ProgressPreference     = 'SilentlyContinue'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $root 'dist'
$tmp  = Join-Path $env:TEMP 'rezaru-fonts'
New-Item -ItemType Directory -Force -Path $dist, $tmp | Out-Null

# Chrome UA нужен, чтобы Google Fonts отдал woff2, а не устаревший ttf
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
$fontsUrl = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Unbounded:wght@500..700&display=swap'

Write-Host 'Загружаю описание шрифтов...'
$fontCss = (Invoke-WebRequest -Uri $fontsUrl -Headers @{ 'User-Agent' = $ua } -UseBasicParsing).Content

$urls = [regex]::Matches($fontCss, 'https://fonts\.gstatic\.com/[^)]+\.woff2') |
        ForEach-Object { $_.Value } | Select-Object -Unique

Write-Host "Вшиваю $($urls.Count) файлов шрифтов..."
foreach ($url in $urls) {
    $file = Join-Path $tmp ([IO.Path]::GetFileName($url))
    if (-not (Test-Path $file)) {
        Invoke-WebRequest -Uri $url -Headers @{ 'User-Agent' = $ua } -OutFile $file -UseBasicParsing
    }
    $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($file))
    $fontCss = $fontCss.Replace($url, "data:font/woff2;base64,$b64")
}

$html = Get-Content (Join-Path $root 'index.html') -Raw -Encoding UTF8
$css  = Get-Content (Join-Path $root 'style.css')  -Raw -Encoding UTF8
$js   = Get-Content (Join-Path $root 'script.js')  -Raw -Encoding UTF8

# Ссылки на внешние шрифты заменяем встроенным @font-face
$html = [regex]::Replace($html, '\s*<link rel="preconnect"[^>]*>', '')
$html = [regex]::Replace($html, '\s*<link href="https://fonts\.googleapis\.com[^>]*>', '')
# ?v=N в адресах — защита от кеша браузера, на инлайн она влиять не должна
$html = [regex]::Replace($html, '<link rel="stylesheet" href="style\.css[^"]*">', { "<style>$fontCss</style>`n<style>$css</style>" })
$html = [regex]::Replace($html, '<script src="script\.js[^"]*"></script>', { "<script>$js</script>" })

$out = Join-Path $dist 'rezaru.html'
[IO.File]::WriteAllText($out, $html, (New-Object Text.UTF8Encoding $false))

$kb = [math]::Round((Get-Item $out).Length / 1KB)
Write-Host "Готово: $out ($kb KB)"
