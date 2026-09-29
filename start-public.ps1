# Делает сайт доступным из интернета, пока открыт этот терминал и включён компьютер.
# Локальный сервер (tools/serve.py) отдаёт только файлы сайта. Наружу его выводит
# SSH-туннель localhost.run (без регистрации и установки) — ссылка вида
# https://....lhr.life появится в выводе. С ключом -Cloudflare используется
# Cloudflare Quick Tunnel (в некоторых сетях он заблокирован).
param([switch]$Cloudflare)
$ErrorActionPreference = 'Stop'

$python = Get-Command python -ErrorAction Stop
$port = 5173

$server = Start-Process -FilePath $python.Source `
    -ArgumentList @("$PSScriptRoot\tools\serve.py", "$port") `
    -WorkingDirectory $PSScriptRoot `
    -PassThru `
    -WindowStyle Hidden

try {
    if ($Cloudflare) {
        $cloudflared = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
        if (-not $cloudflared) {
            $cloudflared = @(
                "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe",
                "$env:ProgramFiles\cloudflared\cloudflared.exe"
            ) | Where-Object { Test-Path $_ } | Select-Object -First 1
        }
        if (-not $cloudflared) { throw 'cloudflared не найден. Установите: winget install --id Cloudflare.cloudflared' }
        & $cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$port"
    }
    else {
        Write-Host 'Подключаюсь к localhost.run... Ссылка на сайт появится ниже (https://....lhr.life).'
        & ssh -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes `
            -T -R "80:127.0.0.1:$port" nokey@localhost.run
    }
}
finally {
    if ($server -and -not $server.HasExited) {
        Stop-Process -Id $server.Id -Force
    }
}
