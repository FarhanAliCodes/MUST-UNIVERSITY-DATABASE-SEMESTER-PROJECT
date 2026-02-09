import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER || "localhost",
  port: parseInt(process.env.DB_PORT || "1433"),
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "InventoryDB",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }

  try {
    pool = await sql.connect(config);
    console.log("Database connected successfully");
    return pool;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

export async function query<T>(
  sqlQuery: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const pool = await getConnection();
  const request = pool.request();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }

  const result = await request.query(sqlQuery);
  return result.recordset as T[];
}

export async function execute(
  sqlQuery: string,
  params?: Record<string, unknown>
): Promise<sql.IResult<unknown>> {
  const pool = await getConnection();
  const request = pool.request();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }

  return await request.query(sqlQuery);
}

export async function executeProc(
  procName: string,
  params?: Record<string, unknown>
): Promise<sql.IProcedureResult<unknown>> {
  const pool = await getConnection();
  const request = pool.request();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }

  return await request.execute(procName);
}

export { sql };
