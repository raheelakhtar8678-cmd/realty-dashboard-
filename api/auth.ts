import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req: any, res: any) {
  const { action } = req.query;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // REGISTER
      if (action === 'register') {
        const { username, password, securityQuestion, securityAnswer } = req.body;
        
        // 1. Ensure Table Exists (Self-Healing DB)
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
        } catch (dbError) {
          console.error("DB Init Error:", dbError);
          // Continue, as table might exist and error is something else, 
          // or we let the next query fail with a precise error.
        }
        
        // 2. Check if user exists
        const existing = await sql`SELECT username FROM users WHERE username = ${username}`;
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

        await sql`
          INSERT INTO users (username, password_hash, security_question, answer_hash, data)
          VALUES (${username}, ${hashedPassword}, ${securityQuestion}, ${hashedAnswer}, '{}'::jsonb)
        `;

        return res.status(200).json({ success: true });
      }

      // LOGIN
      if (action === 'login') {
        const { username, password } = req.body;
        
        // Protect against table not existing on login too
        try {
           const result = await sql`SELECT password_hash FROM users WHERE username = ${username}`;
           
           if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
           
           const isValid = await bcrypt.compare(password, result.rows[0].password_hash);
           if (isValid) return res.status(200).json({ success: true });
           
           return res.status(401).json({ error: 'Invalid credentials' });
        } catch (e: any) {
           // If table doesn't exist, user definitely doesn't exist
           if (e.code === '42P01') {
             return res.status(404).json({ error: 'User database not initialized. Please Register first.' });
           }
           throw e;
        }
      }

      // RESET PASSWORD
      if (action === 'reset') {
        const { username, answer, newPassword } = req.body;
        const result = await sql`SELECT answer_hash FROM users WHERE username = ${username}`;
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const isAnswerValid = await bcrypt.compare(answer.toLowerCase().trim(), result.rows[0].answer_hash);
        
        if (!isAnswerValid) return res.status(401).json({ error: 'Security answer incorrect' });

        const newHash = await bcrypt.hash(newPassword, 10);
        await sql`UPDATE users SET password_hash = ${newHash} WHERE username = ${username}`;
        
        return res.status(200).json({ success: true });
      }
    }

    if (req.method === 'GET') {
      // GET SECURITY QUESTION
      if (action === 'question') {
        const { username } = req.query;
        try {
          const result = await sql`SELECT security_question FROM users WHERE username = ${username}`;
          
          if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
          
          return res.status(200).json({ question: result.rows[0].security_question });
        } catch (e: any) {
           if (e.code === '42P01') return res.status(404).json({ error: 'Database empty' });
           throw e;
        }
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: `Server Error: ${error.message || 'Unknown'}` });
  }
}