@echo off
chcp 65001 >nul
title MenuPlan - Planificador de Menu Semanal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  set "PATH=C:\Users\migue\.gemini\antigravity\brain\164c9be5-40d2-4374-b1aa-5939d227d8e3\scratch\node-v22.14.0-win-x64;%PATH%"
)

echo ==================================================
echo   Iniciando MenuPlan...
echo   Se abrira automaticamente en tu navegador.
echo   (No cierres esta ventana mientras uses la app)
echo ==================================================
echo.

node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --open
pause
