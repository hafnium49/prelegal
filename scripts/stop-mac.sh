#!/usr/bin/env bash
set -euo pipefail

CONTAINER="prelegal"

if docker rm -f "$CONTAINER" >/dev/null 2>&1; then
  echo "Stopped $CONTAINER"
else
  echo "$CONTAINER is not running"
fi
