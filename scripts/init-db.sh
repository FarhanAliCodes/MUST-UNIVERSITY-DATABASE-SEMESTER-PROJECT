#!/bin/bash

echo "[OK] Starting database initialization..."

DB_SERVER="${DB_SERVER:-localhost}"
DB_PORT="${DB_PORT:-1433}"
DB_USER="${DB_USER:-sa}"
DB_PASSWORD="${DB_PASSWORD:-YourStrongPassword123!}"
DB_NAME="${DB_NAME:-InventoryDB}"

MAX_RETRIES=30
RETRY_INTERVAL=2

wait_for_db() {
    echo "[OK] Waiting for SQL Server to be ready..."
    for i in $(seq 1 $MAX_RETRIES); do
        /opt/mssql-tools18/bin/sqlcmd -S "$DB_SERVER,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "[OK] SQL Server is ready!"
            return 0
        fi
        echo "Attempt $i/$MAX_RETRIES - SQL Server not ready, waiting ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done
    echo "[ERROR] SQL Server did not become ready in time"
    return 1
}

create_database() {
    echo "[OK] Creating database if not exists..."
    /opt/mssql-tools18/bin/sqlcmd -S "$DB_SERVER,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -C -Q "
        IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$DB_NAME')
        BEGIN
            CREATE DATABASE [$DB_NAME];
            PRINT 'Database created successfully';
        END
        ELSE
        BEGIN
            PRINT 'Database already exists';
        END
    "
}

run_migration() {
    local file=$1
    local filename=$(basename "$file")
    echo "[OK] Running migration: $filename"
    /opt/mssql-tools18/bin/sqlcmd -S "$DB_SERVER,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_NAME" -C -i "$file"
    if [ $? -eq 0 ]; then
        echo "[OK] Completed: $filename"
    else
        echo "[ERROR] Failed: $filename"
        return 1
    fi
}

run_all_migrations() {
    local script_dir="$(dirname "$0")"
    local db_dir="$script_dir/../database"
    
    if [ ! -d "$db_dir" ]; then
        db_dir="/app/database"
    fi
    
    echo "[OK] Running migrations from: $db_dir"
    
    for file in "$db_dir"/0[1-5]*.sql; do
        if [ -f "$file" ]; then
            run_migration "$file" || return 1
        fi
    done
    
    echo "[OK] All migrations completed successfully!"
}

main() {
    wait_for_db || exit 1
    create_database || exit 1
    run_all_migrations || exit 1
    echo "[OK] Database initialization complete!"
}

main
