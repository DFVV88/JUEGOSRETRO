@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\prepare.ps1"
if errorlevel 1 (
  echo.
  echo La preparacion no termino correctamente.
  pause
  exit /b %errorlevel%
)
echo.
echo Listo. Ejecuta INICIAR_IGNITION.bat
pause
