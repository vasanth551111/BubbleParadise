@echo off
title Bubble Paradise Launcher
echo ===================================================
echo   🫧 Welcome to Bubble Paradise! 🫧
echo ===================================================
echo.
echo Starting the sensory experience...
echo.

:: Set local server port
set PORT=8086

:: Terminate any existing process on that port just in case
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :%PORT% ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

:: Start Python HTTP server in the background
start /B python -m http.server %PORT% >nul 2>&1

:: Wait a brief moment for the server to spin up
timeout /t 2 /nobreak >nul

:: Open game in default web browser
start http://localhost:%PORT%/index.html

echo.
echo ---------------------------------------------------
echo   Game is running!
echo ---------------------------------------------------
echo   Please keep this window open while playing.
echo   Press any key to close the game and cleanup.
echo ---------------------------------------------------
echo.
pause

:: Cleanup and kill Python server on exit
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :%PORT% ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
exit
