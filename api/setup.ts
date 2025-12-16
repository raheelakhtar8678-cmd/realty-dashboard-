import { sql } from '@vercel/postgres';

export default async function handler(req: any, res: any) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(255) PRIMARY KEY,
        password_hash VARCHAR(255) NOT NULL,
        security_question TEXT,
        answer_hash VARCHAR(255),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return res.status(200).json({ message: "Database initialized successfully" });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}