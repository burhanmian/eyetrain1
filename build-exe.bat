@echo off
TITLE MoCap Studio - Build Windows .exe
echo.
echo  ================================================
echo   Building MoCap Studio Windows Installer (.exe)
echo  ================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo  ERROR: Node.js not found. Install from https://nodejs.org
  pause & exit /b 1
)

:: Install all dependencies
echo  [1/4] Installing dependencies...
call npm install
cd client && call npm install && cd ..

:: Build React frontend
echo  [2/4] Building React frontend...
cd client && call npm run build && cd ..

:: Install electron-builder if missing
echo  [3/4] Installing Electron build tools...
call npm install --save-dev electron electron-builder

:: Package into .exe
echo  [4/4] Packaging into Windows installer...
call npx electron-builder --win

echo.
echo  ================================================
echo   Done!  Installer is in the  dist\  folder.
echo  ================================================
echo.
pause
