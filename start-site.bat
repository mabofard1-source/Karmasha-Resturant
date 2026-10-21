@echo off
cd /d "%~dp0"
if not exist "node_modules\vite" (
  echo Installing the site dependencies...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm run dev
pause
