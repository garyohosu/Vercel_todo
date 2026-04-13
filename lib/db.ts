import { neon } from '@neondatabase/serverless';

export type DatabaseClient = {
  query<T>(sqlText: string, params?: unknown[]): Promise<T[]>;
};

class NeonDatabaseClient implements DatabaseClient {
  private readonly sql;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
  }

  async query<T>(sqlText: string, params: unknown[] = []): Promise<T[]> {
    return this.sql.query(sqlText, params) as Promise<T[]>;
  }
}

let client: DatabaseClient | null = null;

export function getDb(): DatabaseClient {
  if (client) {
    return client;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  client = new NeonDatabaseClient(connectionString);
  return client;
}
