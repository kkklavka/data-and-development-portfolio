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

echo Installing build dependencies...
%PYTHON_CMD% -m pip install --upgrade pip
%PYTHON_CMD% -m pip install -r requirements-dev.txt
if errorlevel 1 (
    echo.
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Running tests...
%PYTHON_CMD% -m pytest -q
if errorlevel 1 (
    echo.
    echo Tests failed. EXE was not built.
    pause
    exit /b 1
)

echo.
echo Building Obnulenie.exe...
%PYTHON_CMD% -m PyInstaller --clean Obnulenie.spec
if errorlevel 1 (
    echo.
    echo Build failed.
    pause
    exit /b 1
)

echo.
echo Done. EXE file:
echo dist\Obnulenie.exe
pause
