#!/bin/bash

echo "🔧 Setting up fashion-store development environment..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo "📌 Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✅ $PYTHON_VERSION found${NC}"

# Check Node
echo ""
echo "📌 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js $NODE_VERSION found${NC}"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."

cd backend

if [ -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment already exists${NC}"
else
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Activate venv
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "Installing dependencies..."
pip install -q -r requirements.txt
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Remember to update SECRET_KEY in .env for production${NC}"
else
    echo ".env file already exists"
fi

# Deactivate venv
deactivate

cd ..

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."

cd frontend

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies already installed${NC}"
else
    echo "Installing dependencies..."
    npm install --quiet
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo ""
echo "1️⃣  For Docker deployment:"
echo "   docker compose up"
echo ""
echo "2️⃣  For local development:"
echo ""
echo "   Backend:"
echo "   cd backend"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "   venv\\Scripts\\activate"
else
    echo "   source venv/bin/activate"
fi
echo "   python main.py"
echo ""
echo "   Frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
