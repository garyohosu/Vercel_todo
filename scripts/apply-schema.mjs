import { readFile } from 'node:fs/promises';

import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(connectionString);
const schemaPath = new URL('../db/schema.sql', import.meta.url);
const schemaText = await readFile(schemaPath, 'utf8');
const statements = schemaText
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log('Schema applied');
