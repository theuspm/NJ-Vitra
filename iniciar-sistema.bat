@echo off
title Sistema Vidracaria - Servidor Local
color 0B

echo ======================================================
echo          SISTEMA DE GESTAO PARA VIDRACARIA
echo ======================================================
echo.

:: 1. Verifica se o Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Node.js nao foi encontrado neste computador!
    echo.
    echo Para rodar localmente no Windows, instale o Node.js gratuito em:
    echo https://nodejs.org/ (baixe a versao LTS recomendada)
    echo.
    pause
    exit /b
)

:: 2. Se a pasta dist nao existir, prepara o build automaticamente
if not exist "%~dp0dist\index.html" (
    echo [INFO] Primeira execucao: pasta de producao 'dist' nao encontrada.
    cd /d "%~dp0"
    
    if not exist "%~dp0node_modules" (
        echo [INFO] Baixando dependencias necessarias...
        call npm install --legacy-peer-deps
    )
    
    echo [INFO] Compilando o sistema para modo de alta performance...
    call npm run build
    
    if not exist "%~dp0dist\index.html" (
        color 0C
        echo.
        echo [ERRO] Nao foi possivel compilar a pasta 'dist'.
        echo Verifique os erros acima no terminal.
        pause
        exit /b
    )
)

:: 3. Inicia o servidor local e abre o navegador
cd /d "%~dp0"
echo [INFO] Iniciando o servidor local e abrindo o sistema...
node local-server.js

pause
