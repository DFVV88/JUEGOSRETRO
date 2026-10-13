param(
    [Parameter(Mandatory=$true)][string]$Root,
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path $Root).Path
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Servidor Ignition: http://127.0.0.1:$Port/"
Write-Host "Raiz: $Root"

function Get-ContentType([string]$Path) {
    switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { "text/html; charset=utf-8" }
        ".htm"  { "text/html; charset=utf-8" }
        ".js"   { "application/javascript; charset=utf-8" }
        ".mjs"  { "application/javascript; charset=utf-8" }
        ".css"  { "text/css; charset=utf-8" }
        ".wasm" { "application/wasm" }
        ".zip"  { "application/zip" }
        ".json" { "application/json; charset=utf-8" }
        ".png"  { "image/png" }
        ".jpg"  { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".svg"  { "image/svg+xml" }
        ".ico"  { "image/x-icon" }
        ".ogg"  { "audio/ogg" }
        default { "application/octet-stream" }
    }
}

while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
        $stream = $client.GetStream()
        $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 8192, $true)
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) { $client.Close(); continue }

        $headers = @{}
        while ($true) {
            $line = $reader.ReadLine()
            if ([string]::IsNullOrEmpty($line)) { break }
            $idx = $line.IndexOf(":")
            if ($idx -gt 0) {
                $headers[$line.Substring(0,$idx).Trim().ToLowerInvariant()] = $line.Substring($idx+1).Trim()
            }
        }

        $parts = $requestLine.Split(" ")
        $method = $parts[0]
        $rawPath = $parts[1].Split("?")[0]
        $decoded = [Uri]::UnescapeDataString($rawPath).TrimStart("/")
        if ([string]::IsNullOrWhiteSpace($decoded)) { $decoded = "boxedwine.html" }

        $local = Join-Path $Root ($decoded -replace "/", "\")
        $full = [IO.Path]::GetFullPath($local)

        if (-not $full.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $full -PathType Leaf)) {
            $body = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $head = "HTTP/1.1 404 Not Found`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
            $hb = [Text.Encoding]::ASCII.GetBytes($head)
            $stream.Write($hb,0,$hb.Length)
            $stream.Write($body,0,$body.Length)
            continue
        }

        $fi = Get-Item $full
        $start = 0L
        $end = $fi.Length - 1
        $status = "200 OK"

        if ($headers.ContainsKey("range") -and $headers["range"] -match "^bytes=(\d*)-(\d*)") {
            if ($matches[1]) { $start = [int64]$matches[1] }
            if ($matches[2]) { $end = [int64]$matches[2] }
            if ($end -ge $fi.Length) { $end = $fi.Length - 1 }
            if ($start -le $end) { $status = "206 Partial Content" }
        }

        $length = $end - $start + 1
        $ct = Get-ContentType $full
        $headerText = "HTTP/1.1 $status`r`n" +
                      "Content-Type: $ct`r`n" +
                      "Accept-Ranges: bytes`r`n" +
                      "Content-Length: $length`r`n"
        if ($status.StartsWith("206")) {
            $headerText += "Content-Range: bytes $start-$end/$($fi.Length)`r`n"
        }
        $headerText += "Cache-Control: no-cache`r`nConnection: close`r`n`r`n"

        $hb = [Text.Encoding]::ASCII.GetBytes($headerText)
        $stream.Write($hb,0,$hb.Length)

        if ($method -ne "HEAD") {
            $fs = [IO.File]::OpenRead($full)
            try {
                $fs.Seek($start,[IO.SeekOrigin]::Begin) | Out-Null
                $buffer = New-Object byte[] 65536
                $remaining = $length
                while ($remaining -gt 0) {
                    $want = [Math]::Min($buffer.Length, $remaining)
                    $read = $fs.Read($buffer,0,$want)
                    if ($read -le 0) { break }
                    $stream.Write($buffer,0,$read)
                    $remaining -= $read
                }
            } finally {
                $fs.Dispose()
            }
        }
    } catch {
        Write-Warning $_
    } finally {
        $client.Close()
    }
}
