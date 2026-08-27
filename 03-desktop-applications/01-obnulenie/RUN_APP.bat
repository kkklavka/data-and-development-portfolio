@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_CMD=python"
%PYTHON_CMD% --version >nul 2>&1
if errorlevel 1 set "PYTHON_CMD=py -3"

%PYTHON_CMD% --version >nul 2>&1
if errorlevel 1 (
    echo Python was not found. Install Python or run from an existing Python environment.
    pause
    exit /b 1
)

%PYTHON_CMD% -m pip install openpyxl pywin32 >nul 2>&1
%PYTHON_CMD% programma_obnulenie_app.py

if errorlevel 1 (
    echo.
    echo The app did not start. Try running INSTALL_LIBRARIES.bat first.
    echo.
    pause
)
