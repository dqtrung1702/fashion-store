#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${1:-${ROOT_DIR}/data-snapshots/current}"

MONGODB_SERVICE="${MONGODB_SERVICE:-mongodb}"
MONGODB_USERNAME="${MONGO_INITDB_ROOT_USERNAME:-admin}"
MONGODB_PASSWORD="${MONGO_INITDB_ROOT_PASSWORD:-admin}"
DATABASE_NAME="${DATABASE_NAME:-fashion_store}"

MINIO_SERVICE="${MINIO_SERVICE:-minio}"
MINIO_CONTAINER="${MINIO_CONTAINER:-fashion_store_minio}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-${MINIO_ACCESS_KEY:-minioadmin}}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-${MINIO_SECRET_KEY:-minioadmin123}}"
MINIO_BUCKET="${MINIO_BUCKET:-fashion-store-assets}"

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}" >&2
    exit 1
  fi
}

require_command docker

mkdir -p "${OUTPUT_DIR}/mongo" "${OUTPUT_DIR}/minio"

echo "Exporting MongoDB collections to ${OUTPUT_DIR}/mongo"

mapfile -t collections < <(
  docker compose exec -T "${MONGODB_SERVICE}" \
    mongosh \
      --username "${MONGODB_USERNAME}" \
      --password "${MONGODB_PASSWORD}" \
      --authenticationDatabase admin \
      --quiet \
      --eval "db.getSiblingDB(\"${DATABASE_NAME}\").getCollectionNames().join('\n')"
)

if [ "${#collections[@]}" -eq 0 ]; then
  echo "No MongoDB collections found in database ${DATABASE_NAME}" >&2
else
  for collection in "${collections[@]}"; do
    [ -n "${collection}" ] || continue
    docker compose exec -T "${MONGODB_SERVICE}" \
      mongoexport \
        --username "${MONGODB_USERNAME}" \
        --password "${MONGODB_PASSWORD}" \
        --authenticationDatabase admin \
        --db "${DATABASE_NAME}" \
        --collection "${collection}" \
        --sort '{"_id":1}' \
        --jsonArray \
        --pretty > "${OUTPUT_DIR}/mongo/${collection}.json"
  done
fi

echo "Mirroring MinIO bucket ${MINIO_BUCKET} to ${OUTPUT_DIR}/minio/${MINIO_BUCKET}"

network_name="$(
  docker inspect \
    -f '{{range $name, $v := .NetworkSettings.Networks}}{{$name}}{{println}}{{end}}' \
    "${MINIO_CONTAINER}" | head -n1 | tr -d '\r'
)"

if [ -z "${network_name}" ]; then
  echo "Could not determine Docker network for container ${MINIO_CONTAINER}" >&2
  exit 1
fi

docker run --rm \
  --network "${network_name}" \
  --entrypoint /bin/sh \
  -v "${OUTPUT_DIR}/minio:/export" \
  minio/mc -c "
    mc alias set local http://${MINIO_SERVICE}:9000 '${MINIO_ROOT_USER}' '${MINIO_ROOT_PASSWORD}' >/dev/null &&
    mc mirror --overwrite --remove local/${MINIO_BUCKET} /export/${MINIO_BUCKET}
  "

cat > "${OUTPUT_DIR}/SNAPSHOT_INFO.txt" <<EOF
Created at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
MongoDB service: ${MONGODB_SERVICE}
MongoDB database: ${DATABASE_NAME}
MinIO service: ${MINIO_SERVICE}
MinIO bucket: ${MINIO_BUCKET}
EOF

echo "Snapshot created in ${OUTPUT_DIR}"
echo "Next steps:"

if [[ "${OUTPUT_DIR}" == "${ROOT_DIR}"/* ]]; then
  relative_output="${OUTPUT_DIR#${ROOT_DIR}/}"
  echo "  git add ${relative_output}"
  echo "  git commit -m 'Add runtime data snapshot'"
  echo "  git push"
else
  echo "  Re-run with an output path inside ${ROOT_DIR} before committing to Git."
fi
