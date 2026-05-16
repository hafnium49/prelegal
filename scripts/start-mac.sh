#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

IMAGE="prelegal:latest"
CONTAINER="prelegal"

echo "Building image..."
docker build -t "$IMAGE" .

echo "Removing any existing container..."
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

echo "Starting container..."
docker run -d --name "$CONTAINER" -p 8000:8000 "$IMAGE" >/dev/null

echo "Prelegal running at http://localhost:8000"
