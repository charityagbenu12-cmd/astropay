import pg from 'pg';
import { env } from '@/lib/env';

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var __astropayPool: pg.Pool | undefined;
}

export const pool = global.__astropayPool || new Pool({
  connectionString: env.databaseUrl,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
});

if (process.env.NODE_ENV !== 'production') global.__astropayPool = pool;

export const query = async <T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params: unknown[] = []) =>
  pool.query<T>(text, params);

export const withTransaction = async <T>(fn: (client: pg.PoolClient) => Promise<T>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
