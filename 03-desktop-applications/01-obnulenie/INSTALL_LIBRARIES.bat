@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_CMD=python"
%PYTHON_CMD% --version >nul 2>&1
if errorlevel 1 set "PYTHON_CMD=py -3"

%PYTHON_CMD% --version >nul 2>&1
if errorlevel 1 (
    echo Python was not found. Install Python first.
    pause
    exit /b 1
)

echo Installing libraries...
%PYTHON_CMD% -m pip install --upgrade pip
%PYTHON_CMD% -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo Failed to install libraries.
    pause
    exit /b 1
)

echo.
echo Done.
pause
