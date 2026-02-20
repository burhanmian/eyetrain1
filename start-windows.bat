@echo off
TITLE MoCap Studio
echo.
echo  ==========================================
echo   MoCap Studio - Motion Capture Software
echo  ==========================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo  ERROR: Node.js not found.
  echo  Please download and install Node.js from https://nodejs.org
  echo  Then run this script again.
  pause
  exit /b 1
)

:: Install dependencies if node_modules missing
if not exist "node_modules" (
  echo  Installing server dependencies...
  call npm install
)
if not exist "client\node_modules" (
  echo  Installing client dependencies...
  cd client && call npm install && cd ..
)

:: Build React if build folder missing
if not exist "client\build" (
  echo  Building client...
  cd client && call npm run build && cd ..
)

echo.
echo  Starting MoCap Studio...
echo  Open http://localhost:5000 in your browser.
echo.
echo  For Kinect support, open a second terminal and run:
echo    python bridge\kinect_bridge.py --device 2
echo.
start "" http://localhost:5000
node server\index.js
pause
