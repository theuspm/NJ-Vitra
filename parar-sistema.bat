@echo off
title Encerrar Sistema Vidracaria
color 0C

echo Encerrando o servidor local do sistema...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)

echo.
echo Sistema encerrado com sucesso!
timeout /t 2 >nul
exit
