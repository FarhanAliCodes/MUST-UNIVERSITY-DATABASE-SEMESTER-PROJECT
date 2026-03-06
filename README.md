# Inventory & Supply Chain Analytics System

A Next.js-based inventory and supply chain management system with SQL Server database backend.

## Prerequisites

Before running this application, ensure you have the following installed:

- [Docker](https://www.docker.com/get-started) (version 20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or later)

## Quick Start

### 1. Create Environment File

Create a `.env` file in the root directory of the project with the following content:

```env
DB_PASSWORD=YourStrongPassword123!
DB_NAME=InventoryDB
```

**Important:** 
- Replace `YourStrongPassword123!` with a strong password of your choice
- The password must meet SQL Server requirements:
  - At least 8 characters long
  - Contains uppercase and lowercase letters
  - Contains numbers
  - Contains special characters

### 2. Run with Docker Compose

Start all services (database, database initialization, and application):

```bash
docker-compose up -d
```

This command will:
- Build the Next.js application image
- Start the SQL Server container
- Initialize the database with tables, views, stored procedures, triggers, and seed data
- Start the application container

### 3. Access the Application

Once all containers are running, access the application at:

```
http://localhost
```

The application is mapped to port 80 on your host machine.

## Docker Compose Services

The `docker-compose.yml` file defines three services:

### 1. `sqlserver`
- **Image:** `mcr.microsoft.com/mssql/server:2022-latest`
- **Container Name:** `inventory-db`
- **Port:** 1433 (exposed internally)
- **Volume:** Persistent data storage for database files

### 2. `db-init`
- **Image:** `mcr.microsoft.com/mssql/server:2022-latest`
- **Container Name:** `inventory-db-init`
- **Purpose:** Initializes the database by running SQL scripts from the `database/` directory
- **Dependencies:** Waits for SQL Server to be healthy before running

### 3. `app`
- **Container Name:** `inventory-app`
- **Port:** 80 (host) → 3000 (container)
- **Dependencies:** Waits for database initialization to complete
- **Build:** Uses the `Dockerfile` to build the Next.js application

## Useful Commands

### View Running Containers

```bash
docker-compose ps
```

### View Logs

View logs for all services:
```bash
docker-compose logs -f
```

View logs for a specific service:
```bash
docker-compose logs -f app
docker-compose logs -f sqlserver
docker-compose logs -f db-init
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes

**Warning:** This will delete all database data:

```bash
docker-compose down -v
```

### Rebuild Application

If you make changes to the application code:

```bash
docker-compose up -d --build app
```

### Restart Services

```bash
docker-compose restart
```

## Database Initialization

The database initialization process runs automatically when you start the containers. It executes the following SQL scripts in order:

1. `01_create_tables.sql` - Creates database tables
2. `02_create_views.sql` - Creates database views
3. `03_create_stored_procedures.sql` - Creates stored procedures
4. `04_create_triggers.sql` - Creates triggers
5. `05_seed_data.sql` - Inserts sample data

The initialization container (`db-init`) will exit after successfully completing the setup. This is expected behavior.

## Troubleshooting

### Container Fails to Start

1. **Check if port 80 is already in use:**
   ```bash
   # On Windows (PowerShell)
   netstat -ano | findstr :80
   
   # On Linux/Mac
   lsof -i :80
   ```
   If port 80 is in use, you can modify the port mapping in `docker-compose.yml`:
   ```yaml
   ports:
     - "8080:3000"  # Change 80 to 8080 or another available port
   ```

2. **Check Docker logs:**
   ```bash
   docker-compose logs
   ```

### Database Connection Issues

1. **Verify SQL Server is healthy:**
   ```bash
   docker-compose ps
   ```
   The `sqlserver` service should show as "healthy".

2. **Check database initialization logs:**
   ```bash
   docker-compose logs db-init
   ```

3. **Verify environment variables:**
   Ensure your `.env` file exists and contains the required variables.

### Password Requirements Not Met

If you see errors about password complexity, ensure your `DB_PASSWORD` in the `.env` file meets SQL Server requirements:
- Minimum 8 characters
- Contains uppercase letters
- Contains lowercase letters
- Contains numbers
- Contains special characters

### Re-initialize Database

To re-run database initialization (this will recreate the database):

```bash
docker-compose down -v
docker-compose up -d
```

## Development

### Running in Development Mode

For local development without Docker:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:
   ```env
   DB_SERVER=localhost
   DB_PORT=1433
   DB_USER=sa
   DB_PASSWORD=YourStrongPassword123!
   DB_NAME=InventoryDB
   DB_ENCRYPT=false
   DB_TRUST_SERVER_CERTIFICATE=true
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
.
├── database/              # SQL scripts for database setup
│   ├── 01_create_tables.sql
│   ├── 02_create_views.sql
│   ├── 03_create_stored_procedures.sql
│   ├── 04_create_triggers.sql
│   ├── 05_seed_data.sql
│   └── 06_sample_queries.sql
├── src/                   # Next.js application source code
│   ├── app/              # Next.js app directory
│   ├── components/      # React components
│   ├── lib/             # Utility functions and database connection
│   └── types/           # TypeScript type definitions
├── scripts/              # Database initialization scripts
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile           # Docker image build configuration
└── package.json         # Node.js dependencies
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_PASSWORD` | SQL Server SA password | Yes | - |
| `DB_NAME` | Database name | No | `InventoryDB` |

Additional environment variables used by the application:
- `DB_SERVER` - Database server (automatically set to `sqlserver` in Docker)
- `DB_PORT` - Database port (automatically set to `1433` in Docker)
- `DB_USER` - Database user (automatically set to `sa` in Docker)
- `DB_ENCRYPT` - Enable encryption (set to `false` in Docker)
- `DB_TRUST_SERVER_CERTIFICATE` - Trust server certificate (set to `true` in Docker)

## Support

For issues or questions, please check the logs first:
```bash
docker-compose logs -f
```

## License

This project is part of a university database semester project.

