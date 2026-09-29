# Портфолио Андрея Носикова

Сайт-портфолио UX/UI-дизайнера: главная, кейсы PARQ и МетеоРитм, резюме в поп-апе.
Статический HTML/CSS/JS без сборки — открывается в любом браузере.

## Структура

```
index.html        главная
parq.html         кейс PARQ
meteoritm.html    кейс МетеоРитм
style.css         все стили (тёмная тема основная, светлая через переключатель)
site.js           поп-апы (резюме, сертификат) и переключатель темы
gradient.js       живой градиент в hero и нижнем блоке (WebGL, без зависимостей)
img/              изображения в webp
tools/typograph.py  убирает висячие предлоги (неразрывные пробелы)
```

## Как запустить локально

В VS Code: установите расширение **Live Server** (VS Code предложит его сам),
откройте `index.html` и нажмите **Go Live** внизу справа.

Или из терминала в папке проекта:

```bash
python -m http.server 5173
```

и откройте http://localhost:5173.

## Доступ из интернета, пока включён компьютер

Из папки проекта в PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-public.ps1
```

Скрипт запустит локальный сервер (`tools/serve.py` — отдаёт только файлы сайта,
без `.git`, `tools` и прочего) и SSH-туннель [localhost.run](https://localhost.run).
В выводе появится ссылка вида `https://....lhr.life` — её можно отправлять.

- Окно терминала должно оставаться открытым, компьютер — включённым и в сети.
- При каждом запуске ссылка новая. Постоянный адрес — бесплатный аккаунт на
  localhost.run или хостинг (GitHub Pages).
- Вариант через Cloudflare: `.\start-public.ps1 -Cloudflare` (нужен `cloudflared`;
  в сетях, где блокируются туннели Cloudflare, не подключится).

## После правок текста

Прогоните типограф, чтобы не было висячих предлогов:

```bash
python tools/typograph.py index.html parq.html meteoritm.html
```

## Работа с двух компьютеров

1. Перед началом работы — **Fetch origin → Pull** в GitHub Desktop.
2. После работы — **Commit to main → Push origin**.
