import { Pool } from 'pg';

const DATABASE_URL = "postgresql://neondb_owner:npg_qLE6RyCkAc4e@ep-late-rice-a7gtvzwn-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require";

export const dbConfig = {
  DATABASE_URL,
  DATABASE_URL_UNPOOLED: "postgresql://neondb_owner:npg_qLE6RyCkAc4e@ep-late-rice-a7gtvzwn.ap-southeast-2.aws.neon.tech/neondb?sslmode=require",
  PGHOST: "ep-late-rice-a7gtvzwn-pooler.ap-southeast-2.aws.neon.tech",
  PGHOST_UNPOOLED: "ep-late-rice-a7gtvzwn.ap-southeast-2.aws.neon.tech",
  PGUSER: "neondb_owner",
  PGDATABASE: "neondb",
  PGPASSWORD: "npg_qLE6RyCkAc4e",
  POSTGRES_URL: "postgresql://neondb_owner:npg_qLE6RyCkAc4e@ep-late-rice-a7gtvzwn-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require",
  POSTGRES_URL_NON_POOLING: "postgresql://neondb_owner:npg_qLE6RyCkAc4e@ep-late-rice-a7gtvzwn.ap-southeast-2.aws.neon.tech/neondb?sslmode=require",
  POSTGRES_USER: "neondb_owner",
  POSTGRES_HOST: "ep-late-rice-a7gtvzwn-pooler.ap-southeast-2.aws.neon.tech",
  POSTGRES_PASSWORD: "npg_qLE6RyCkAc4e",
  POSTGRES_DATABASE: "neondb",
  POSTGRES_URL_NO_SSL: "postgresql://neondb_owner:npg_qLE6RyCkAc4e@ep-late-rice-a7gtvzwn-pooler.ap-southeast-2.aws.neon.tech/neondb",
  POSTGRES_PRISMA_URL: "postgresql://neondb_owner:npg_qLE6RyCkAc4e@ep-late-rice-a7gtvzwn-pooler.ap-southeast-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
};

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = pool;

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}
