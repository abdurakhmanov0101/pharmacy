@echo off
echo ========================================================
echo       SAAS APTEKA & TELEGRAM BOT TIZIMINI ISHGA TUSHIRISH
echo ========================================================
echo [1/2] Backend server (3001-port) ishga tushmoqda...
start "Backend API - 3001" /D "%~dp0backend" cmd /k "npm run start:dev"

echo [2/2] Frontend sayt (3000-port) ishga tushmoqda...
start "Frontend UI - 3000" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo ========================================================
echo   TIZIM MUVAFFAQIYATLI ISHGA TUSHIRILDI!
echo   Sayt: http://localhost:3000
echo   API : http://localhost:3001
echo   Telegram Bot: @saas_apteka_bot
echo ========================================================
