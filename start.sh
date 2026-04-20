#!/bin/bash

set -euo pipefail

echo "🚀 Starting Fashion Store Setup..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker is installed"

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker Compose is installed (${COMPOSE_CMD})"

if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

usage() {
    echo "Usage:"
    echo "  ./start.sh          Start existing local Docker images (offline-friendly)"
    echo "  ./start.sh --build  Pull/build images first, then start (requires network if images/deps are missing)"
    echo "  ./start.sh --help   Show this help"
}

BUILD_IMAGES=false

case "${1:-}" in
    "")
        ;;
    --build)
        BUILD_IMAGES=true
        ;;
    --help|-h)
        usage
        exit 0
        ;;
    *)
        echo "❌ Unknown option: $1"
        usage
        exit 1
        ;;
esac

if [ "$BUILD_IMAGES" = true ]; then
    echo "🐳 Pulling external Docker images..."
    $COMPOSE_CMD pull mongodb minio redis

    echo "🐳 Building and starting Docker containers..."
    $COMPOSE_CMD up -d --build --renew-anon-volumes
else
    REQUIRED_IMAGES=(
        "mongo:6.0"
        "minio/minio:latest"
        "redis:7-alpine"
        "fashion-store-backend:latest"
        "fashion-store-frontend:latest"
    )

    MISSING_IMAGES=()
    for IMAGE in "${REQUIRED_IMAGES[@]}"; do
        if ! docker image inspect "$IMAGE" > /dev/null 2>&1; then
            MISSING_IMAGES+=("$IMAGE")
        fi
    done

    if [ "${#MISSING_IMAGES[@]}" -gt 0 ]; then
        echo "❌ Missing local Docker image(s):"
        for IMAGE in "${MISSING_IMAGES[@]}"; do
            echo "   - $IMAGE"
        done
        echo ""
        echo "Run once while online:"
        echo "   ./start.sh --build"
        echo ""
        echo "Or load a saved image bundle before starting:"
        echo "   docker load -i fashion-store-images.tar"
        exit 1
    fi

    echo "🐳 Starting Docker containers from local images..."
    $COMPOSE_CMD up -d --no-build
fi

echo ""
echo "✅ Fashion Store is starting up!"
echo ""
echo "📍 URLs:"
echo "   Frontend:    http://localhost:5173"
echo "   Backend:     http://localhost:8000"
echo "   API Docs:    http://localhost:8000/docs"
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✨ Setup complete! Your Fashion Store is ready to go."
echo ""
echo "📚 Next steps:"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Create an account"
echo "   3. Start shopping!"
echo ""
echo "🛑 To stop services, run: $COMPOSE_CMD down"
