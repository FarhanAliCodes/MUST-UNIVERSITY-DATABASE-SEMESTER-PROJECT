#!/bin/bash
# Migration script for Linux/Mac
# Requires: sqlcmd (mssql-tools) or docker
#
# Usage with sqlcmd installed:
#   ./scripts/init-db.sh -p "YourPassword"
#
# Usage with docker (runs sqlcmd in container):
#   ./scripts/init-db.sh -p "YourPassword" --docker

set -e

DB_SERVER="localhost"
DB_PORT="1433"
DB_USER="sa"
DB_PASSWORD=""
DB_NAME="InventoryDB"
USE_DOCKER=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--server) DB_SERVER="$2"; shift 2 ;;
        -P|--port) DB_PORT="$2"; shift 2 ;;
        -u|--user) DB_USER="$2"; shift 2 ;;
        -p|--password) DB_PASSWORD="$2"; shift 2 ;;
        -d|--database) DB_NAME="$2"; shift 2 ;;
        --docker) USE_DOCKER=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [ -z "$DB_PASSWORD" ]; then
    echo "[ERROR] Password is required. Usage: ./init-db.sh -p \"YourPassword\""
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_DIR="$SCRIPT_DIR/../database"

run_sql() {
    if [ "$USE_DOCKER" = true ]; then
        docker run --rm --network host mcr.microsoft.com/mssql-tools:latest \
            /opt/mssql-tools18/bin/sqlcmd -S "$DB_SERVER,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -C "$@"
    else
        sqlcmd -S "$DB_SERVER,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -C "$@"
    fi
}

run_sql_file() {
    local file=$1
    if [ "$USE_DOCKER" = true ]; then
        docker run --rm --network host -v "$file:/tmp/script.sql:ro" mcr.microsoft.com/mssql-tools:latest \
            /opt/mssql-tools18/bin/sqlcmd -S "$DB_SERVER,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_NAME" -C -i /tmp/script.sql
    else
        sqlcmd -S "$DB_SERVER,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_NAME" -C -i "$file"
    fi
}

echo "[OK] Starting database initialization..."
echo "[OK] Server: $DB_SERVER:$DB_PORT"

echo "[OK] Waiting for SQL Server..."
for i in {1..30}; do
    if run_sql -Q "SELECT 1" > /dev/null 2>&1; then
        echo "[OK] SQL Server is ready!"
        break
    fi
    echo "Attempt $i/30 - waiting..."
    sleep 2
done

echo "[OK] Creating database if not exists..."
run_sql -Q "
    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$DB_NAME')
    BEGIN
        CREATE DATABASE [$DB_NAME];
        PRINT 'Database created';
    END
    ELSE PRINT 'Database exists';
"

echo "[OK] Running migrations from: $DB_DIR"
for file in "$DB_DIR"/0[1-5]*.sql; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "[OK] Running: $filename"
        run_sql_file "$file"
        echo "[OK] Completed: $filename"
    fi
done

echo "[OK] Database initialization complete!"
