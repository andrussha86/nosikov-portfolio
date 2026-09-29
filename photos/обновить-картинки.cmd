@echo off
chcp 65001 >nul
rem Заменяет картинки сайта файлами из этой папки (подробности — README.md рядом).
cd /d "%~dp0.."

set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do if exist "%%D\python.exe" set "PY="%%D\python.exe""
if not defined PY for /d %%D in ("%ProgramFiles%\Python3*") do if exist "%%D\python.exe" set "PY="%%D\python.exe""
if not defined PY (
  echo Python не найден. Установите Python 3 с python.org и запустите снова.
  pause
  exit /b 1
)

%PY% -c "import PIL" 2>nul || %PY% -m pip install --quiet pillow
%PY% tools\photos.py
echo.
pause
