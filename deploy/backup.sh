#!/bin/sh
set -e

DB_PATH="${DB_PATH:-/var/lib/teenage/data.db}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/teenage}"
TS=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/data_${TS}.db"
find "$BACKUP_DIR" -name 'data_*.db' -mtime +14 -delete

echo "backup saved: $BACKUP_DIR/data_${TS}.db"
