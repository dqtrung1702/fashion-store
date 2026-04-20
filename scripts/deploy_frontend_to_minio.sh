#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_BUCKET="${FRONTEND_BUCKET:-fashion-store-frontend}"
FRONTEND_BASE="/${FRONTEND_BUCKET}/"

echo "📦 Building frontend for MinIO path: ${FRONTEND_BASE}"
cd "${ROOT_DIR}/frontend"
npm run build -- --base="${FRONTEND_BASE}"

echo "☁️ Uploading frontend dist to MinIO bucket: ${FRONTEND_BUCKET}"
cd "${ROOT_DIR}"

if python3 -c "import minio" >/dev/null 2>&1; then
  python3 scripts/upload_frontend_to_minio.py --bucket "${FRONTEND_BUCKET}" --clean
else
  echo "ℹ️ Python MinIO SDK not found on host. Using backend Docker image for upload."
  docker compose run --rm --no-deps \
    -v "${ROOT_DIR}:/workspace" \
    -w /workspace \
    -e MINIO_ENDPOINT=minio:9000 \
    -e MINIO_PUBLIC_ENDPOINT="${MINIO_PUBLIC_ENDPOINT:-localhost:9000}" \
    -e MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}" \
    -e MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin123}" \
    -e MINIO_SECURE="${MINIO_SECURE:-false}" \
    backend \
    python scripts/upload_frontend_to_minio.py --bucket "${FRONTEND_BUCKET}" --clean
fi
