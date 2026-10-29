@echo off
chcp 65001 >nul
title Detener Sistema de Biblioteca

echo ===============================================================================
echo                SISTEMA DE GESTION DE BIBLIOTECA - DETENER
echo ===============================================================================
echo.
echo [*] Deteniendo servidores en los puertos 8080 (Backend) y 4200 (Frontend)...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ports = @(8080, 4200);" ^
    "$pids = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique;" ^
    "if ($pids) { foreach ($p in $pids) { Write-Host '  - Terminando proceso PID' $p; Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; } } else { Write-Host '  - No se detectaron servidores activos en los puertos 8080 o 4200.' }"

echo.
echo [OK] Procesos detenidos.
echo.
pause
