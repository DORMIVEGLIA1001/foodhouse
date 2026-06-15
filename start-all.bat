@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"

if exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
  set "PYTHON_EXE=%BACKEND_DIR%\.venv\Scripts\python.exe"
) else (
  set "PYTHON_EXE=python"
)

echo Starting FoodHouse backend...
start "FoodHouse Backend" cmd /k "cd /d "%BACKEND_DIR%" && "%PYTHON_EXE%" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Starting FoodHouse frontend...
start "FoodHouse Frontend" cmd /k "cd /d "%ROOT_DIR%" && npm run dev"

echo FoodHouse frontend and backend are starting in separate windows.
endlocal
