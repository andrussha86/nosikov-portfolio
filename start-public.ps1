# Делает сайт доступным из интернета, пока открыт этот терминал и включён компьютер.
# Пошаговая инструкция: docs/public-server.md
#
# Локальный сервер (tools/serve.py) отдаёт только файлы сайта. Наружу его выводит
# SSH-туннель localhost.run (без регистрации и установки) — ссылка вида
# https://....lhr.life появится в выводе. Если сервис оборвёт соединение,
# скрипт переподключится сам (ссылка при этом может смениться).
# С ключом -Cloudflare используется Cloudflare Quick Tunnel (в некоторых сетях заблокирован).
# Остановить: Ctrl+C или закрыть окно.
param([switch]$Cloudflare)
$ErrorActionPreference = 'Stop'

$python = Get-Command python -ErrorAction Stop
$port = 5173

$server = Start-Process -FilePath $python.Source `
    -ArgumentList @("$PSScriptRoot\tools\serve.py", "$port") `
    -WorkingDirectory $PSScriptRoot `
    -PassThru `
    -WindowStyle Hidden

Write-Host "Локальный сервер: http://127.0.0.1:$port"

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
        while ($true) {
            Write-Host ''
            Write-Host 'Подключаюсь к localhost.run... Ссылка на сайт появится ниже (https://....lhr.life).' -ForegroundColor Cyan
            & ssh -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ServerAliveCountMax=3 `
                -o ExitOnForwardFailure=yes -T -R "80:127.0.0.1:$port" nokey@localhost.run
            Write-Host 'Соединение с localhost.run прервалось. Переподключаюсь через 5 секунд (Ctrl+C — остановить)...' -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
}
finally {
    if ($server -and -not $server.HasExited) {
        Stop-Process -Id $server.Id -Force
    }
    Write-Host 'Сервер остановлен, сайт больше недоступен из интернета.'
}
