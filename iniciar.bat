@echo off
chcp 65001 >nul
title Iniciar Sistema de Biblioteca

echo ===============================================================================
echo                SISTEMA DE GESTION DE BIBLIOTECA - INICIO
echo ===============================================================================
echo.

:: Asegurarse de estar en la carpeta raíz del proyecto
cd /d "%~dp0"

:: -------------------------------------------------------------------------------
:: 1. VERIFICAR Y ARRANCAR POSTGRESQL
:: -------------------------------------------------------------------------------
echo [1/3] Verificando servicio de PostgreSQL...
powershell -NoProfile -Command "if ((Get-Service *postgres* -ErrorAction SilentlyContinue | Where-Object Status -eq 'Running').Count -gt 0) { exit 0 } else { exit 1 }"
if %errorlevel% equ 0 (
    echo       [OK] PostgreSQL ya se encuentra en ejecucion.
) else (
    echo       [*] Intentando iniciar servicio de PostgreSQL...
    powershell -NoProfile -Command "Start-Service *postgres* -ErrorAction SilentlyContinue"
    powershell -NoProfile -Command "if ((Get-Service *postgres* -ErrorAction SilentlyContinue | Where-Object Status -eq 'Running').Count -gt 0) { exit 0 } else { exit 1 }"
    if %errorlevel% equ 0 (
        echo       [OK] PostgreSQL iniciado correctamente.
    ) else (
        echo       [AVISO] No se pudo iniciar el servicio de PostgreSQL en segundo plano.
        echo       Si no esta corriendo, asegurate de abrirlo o iniciar tu servicio en pgAdmin.
    )
)
echo.

:: -------------------------------------------------------------------------------
:: 2. VERIFICAR DEPENDENCIAS DEL FRONTEND
:: -------------------------------------------------------------------------------
if not exist "biblioteca-frontend\node_modules\" (
    echo [!] Dependencias de Node no encontradas. Ejecutando 'npm install'...
    cd /d "%~dp0biblioteca-frontend"
    call npm install
    cd /d "%~dp0"
    echo.
)

:: -------------------------------------------------------------------------------
:: 3. ARRANCAR BACKEND (Spring Boot en puerto 8080)
:: -------------------------------------------------------------------------------
echo [2/3] Levantando Backend (Spring Boot en puerto 8080)...
start "Biblioteca - Backend (Spring Boot)" cmd /k "cd /d ""%~dp0biblioteca-backend"" && title Backend (Spring Boot :8080) && mvnw.cmd spring-boot:run"
echo       - Ventana del Backend iniciada en segundo plano.
echo.

:: -------------------------------------------------------------------------------
:: 4. ARRANCAR FRONTEND (Angular en puerto 4200)
:: -------------------------------------------------------------------------------
echo [3/3] Levantando Frontend (Angular en puerto 4200)...
start "Biblioteca - Frontend (Angular)" cmd /k "cd /d ""%~dp0biblioteca-frontend"" && title Frontend (Angular :4200) && npm start"
echo       - Ventana del Frontend iniciada en segundo plano.
echo.

:: -------------------------------------------------------------------------------
:: 5. ESPERAR A QUE EL SERVIDOR FRONTEND ESTE LISTO Y ABRIR NAVEGADOR
:: -------------------------------------------------------------------------------
echo ===============================================================================
echo Esperando a que el Frontend termine de compilar y responder...
echo (Esto suele tomar entre 5 y 15 segundos)
echo ===============================================================================

for /L %%i in (1,1,35) do (
    curl.exe -s -o nul http://localhost:4200 && goto :abrir_web
    <nul set /p="."
    timeout /t 2 /nobreak >nul
)

:abrir_web
echo.
echo.
echo [*] Servidor Frontend listo. Abriendo navegador...
start http://localhost:4200

echo.
echo ===============================================================================
echo                       TODO ENCENDIDO Y OPERATIVO
echo ===============================================================================
echo  - Aplicacion Web: http://localhost:4200
echo    * Si ya tienes sesion guardada: Entraras de frente a la pagina (libros).
echo    * Si no has iniciado sesion:    Te mandara directo al Inicio de Sesion.
echo.
echo  - Backend API:    http://localhost:8080
echo.
echo  Credenciales de acceso:
echo    * Usuario (Lector):  Cualquier correo de usuario permite autocompletar
echo                         (Ej: usuario@biblioteca.com o tu correo de lector registrado)
echo    * Administrador:     admin@biblioteca.com / admin1234 (Autocompletado no permitido)
echo.
echo  * Nota: Para apagar los servidores cuando termines, ejecuta 'detener.bat'.
echo ===============================================================================
echo.
pause
