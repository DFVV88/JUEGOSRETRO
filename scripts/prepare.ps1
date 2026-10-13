param(
    [string]$GameZip = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Runtime = Join-Path $Root "runtime"
$DownloadDir = Join-Path $Root ".boxedwine-download"
$ReleaseUrl = "https://github.com/danoon2/Boxedwine/releases/download/26R1.0/Boxedwine26R1Web.zip"
$RuntimeZip = Join-Path $DownloadDir "Boxedwine26R1Web.zip"

Write-Host ""
Write-Host "=== IGNITION CHROME - PREPARACION ===" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrWhiteSpace($GameZip)) {
    $candidates = @(
        (Join-Path $Root "IGNITION_BROWSER_SAFE.zip"),
        (Join-Path $Root "IGNITION_CHROME_READY.zip"),
        (Join-Path $env:USERPROFILE "Downloads\IGNITION_BROWSER_SAFE.zip"),
        (Join-Path $env:USERPROFILE "Downloads\IGNITION_CHROME_READY.zip")
    )
    $GameZip = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $GameZip -or -not (Test-Path $GameZip)) {
    Write-Host "No encuentro el ZIP del juego." -ForegroundColor Yellow
    Write-Host "Coloca IGNITION_BROWSER_SAFE.zip junto a PREPARAR_IGNITION.bat"
    Write-Host "o en tu carpeta Descargas y vuelve a ejecutar."
    exit 2
}

Write-Host "[1/4] Juego encontrado:" -ForegroundColor Green
Write-Host "      $GameZip"

if (-not (Test-Path (Join-Path $Runtime "boxedwine.html"))) {
    Write-Host "[2/4] Descargando BoxedWine 26R1 Web..." -ForegroundColor Green
    New-Item -ItemType Directory -Force -Path $DownloadDir | Out-Null

    if (-not (Test-Path $RuntimeZip)) {
        Invoke-WebRequest -Uri $ReleaseUrl -OutFile $RuntimeZip -UseBasicParsing
    }

    $ExtractDir = Join-Path $DownloadDir "extracted"
    if (Test-Path $ExtractDir) {
        Remove-Item $ExtractDir -Recurse -Force
    }
    Expand-Archive -Path $RuntimeZip -DestinationPath $ExtractDir -Force

    $BoxedwineHtml = Get-ChildItem -Path $ExtractDir -Recurse -Filter "boxedwine.html" -File |
        Select-Object -First 1

    if (-not $BoxedwineHtml) {
        throw "No se encontro boxedwine.html dentro de BoxedWine26R1Web.zip"
    }

    $WebRoot = $BoxedwineHtml.Directory.FullName
    Write-Host "      Runtime web encontrado en: $WebRoot"

    if (Test-Path $Runtime) {
        Remove-Item $Runtime -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
    Copy-Item -Path (Join-Path $WebRoot "*") -Destination $Runtime -Recurse -Force
} else {
    Write-Host "[2/4] BoxedWine ya esta preparado." -ForegroundColor Green
}

Write-Host "[3/4] Instalando el paquete de Ignition..." -ForegroundColor Green
Copy-Item -Path $GameZip -Destination (Join-Path $Runtime "ignition.zip") -Force

$GameSize = (Get-Item (Join-Path $Runtime "ignition.zip")).Length
Write-Host ("      ignition.zip: {0:N1} MB" -f ($GameSize / 1MB))

Write-Host "[4/4] Comprobando archivos esenciales..." -ForegroundColor Green
$required = @("boxedwine.html", "ignition.zip")
foreach ($name in $required) {
    if (-not (Test-Path (Join-Path $Runtime $name))) {
        throw "Falta archivo requerido: $name"
    }
}

Write-Host ""
Write-Host "PREPARACION COMPLETA." -ForegroundColor Cyan
Write-Host "Ahora ejecuta INICIAR_IGNITION.bat"
Write-Host ""
