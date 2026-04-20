@echo off
REM Setup script for Windows

echo.
echo 🔧 Setting up fashion-store development environment...
echo.

REM Check Python
echo 📌 Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ %PYTHON_VERSION% found
echo.

REM Check Node
echo 📌 Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found
echo.

REM Setup Backend
echo 📦 Setting up Backend...
cd backend

if exist venv (
    echo ⚠️  Virtual environment already exists
) else (
    echo Creating virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
)

REM Activate venv
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -q -r requirements.txt
echo ✅ Backend dependencies installed
echo.

if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file
    echo ⚠️  Remember to update SECRET_KEY in .env for production
) else (
    echo .env file already exists
)

REM Deactivate venv
deactivate

cd ..

REM Setup Frontend
echo 📦 Setting up Frontend...
cd frontend

if exist node_modules (
    echo ⚠️  Dependencies already installed
) else (
    echo Installing dependencies...
    call npm install --quiet
    echo ✅ Frontend dependencies installed
)

cd ..

echo.
echo ✨ Setup complete!
echo.
echo 📝 Next steps:
echo.
echo 1️⃣  For Docker deployment:
echo    docker-compose up
echo.
echo 2️⃣  For local development:
echo.
echo    Backend:
echo    cd backend
echo    venv\Scripts\activate
echo    python main.py
echo.
echo    Frontend (in another terminal):
echo    cd frontend
echo    npm run dev
echo.
pause
