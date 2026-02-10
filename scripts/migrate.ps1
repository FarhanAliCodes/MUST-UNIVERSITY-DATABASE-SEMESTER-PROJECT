# PowerShell migration script for Windows
# Usage: .\scripts\migrate.ps1 -Password "YourPassword"

param(
    [string]$Server = "localhost",
    [string]$Port = "1433",
    [string]$User = "sa",
    [Parameter(Mandatory=$true)]
    [string]$Password,
    [string]$Database = "InventoryDB"
)

$ConnectionString = "Server=$Server,$Port;User Id=$User;Password=$Password;TrustServerCertificate=True;"

Write-Host "[OK] Starting database initialization..."
Write-Host "[OK] Server: $Server`:$Port"

function Wait-ForDatabase {
    Write-Host "[OK] Waiting for SQL Server to be ready..."
    $maxRetries = 30
    $retryInterval = 2
    
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            $connection = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
            $connection.Open()
            $connection.Close()
            Write-Host "[OK] SQL Server is ready!"
            return $true
        }
        catch {
            Write-Host "Attempt $i/$maxRetries - SQL Server not ready, waiting ${retryInterval}s..."
            Start-Sleep -Seconds $retryInterval
        }
    }
    
    Write-Host "[ERROR] SQL Server did not become ready in time"
    return $false
}

function New-Database {
    Write-Host "[OK] Creating database if not exists..."
    
    $query = @"
        IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$Database')
        BEGIN
            CREATE DATABASE [$Database];
            PRINT 'Database created successfully';
        END
        ELSE
        BEGIN
            PRINT 'Database already exists';
        END
"@
    
    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $connection.Open()
        $command = New-Object System.Data.SqlClient.SqlCommand($query, $connection)
        $command.ExecuteNonQuery() | Out-Null
        $connection.Close()
        Write-Host "[OK] Database check complete"
        return $true
    }
    catch {
        Write-Host "[ERROR] Failed to create database: $_"
        return $false
    }
}

function Invoke-Migration {
    param([string]$FilePath)
    
    $filename = Split-Path $FilePath -Leaf
    Write-Host "[OK] Running migration: $filename"
    
    $DbConnectionString = "Server=$Server,$Port;Database=$Database;User Id=$User;Password=$Password;TrustServerCertificate=True;"
    
    try {
        $sql = Get-Content $FilePath -Raw
        $connection = New-Object System.Data.SqlClient.SqlConnection($DbConnectionString)
        $connection.Open()
        
        $batches = $sql -split '\bGO\b'
        
        foreach ($batch in $batches) {
            $batch = $batch.Trim()
            if ($batch -ne '') {
                $command = New-Object System.Data.SqlClient.SqlCommand($batch, $connection)
                $command.CommandTimeout = 120
                $command.ExecuteNonQuery() | Out-Null
            }
        }
        
        $connection.Close()
        Write-Host "[OK] Completed: $filename"
        return $true
    }
    catch {
        Write-Host "[ERROR] Failed: $filename - $_"
        return $false
    }
}

function Invoke-AllMigrations {
    $scriptDir = Split-Path -Parent $PSCommandPath
    $dbDir = Join-Path (Split-Path -Parent $scriptDir) "database"
    
    Write-Host "[OK] Running migrations from: $dbDir"
    
    $files = Get-ChildItem -Path $dbDir -Filter "0[1-5]*.sql" | Sort-Object Name
    
    foreach ($file in $files) {
        if (-not (Invoke-Migration -FilePath $file.FullName)) {
            return $false
        }
    }
    
    Write-Host "[OK] All migrations completed successfully!"
    return $true
}

if (-not (Wait-ForDatabase)) { exit 1 }
if (-not (New-Database)) { exit 1 }
if (-not (Invoke-AllMigrations)) { exit 1 }

Write-Host "[OK] Database initialization complete!"
