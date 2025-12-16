import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req: any, res: any) {
  const { action } = req.query;

  try {
    if (req.method === 'POST') {
      // REGISTER
      if (action === 'register') {
        const { username, password, securityQuestion, securityAnswer } = req.body;
        
        // Check if user exists
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
        const result = await sql`SELECT password_hash FROM users WHERE username = ${username}`;
        
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const isValid = await bcrypt.compare(password, result.rows[0].password_hash);
        if (isValid) return res.status(200).json({ success: true });
        
        return res.status(401).json({ error: 'Invalid credentials' });
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
        const result = await sql`SELECT security_question FROM users WHERE username = ${username}`;
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        
        return res.status(200).json({ question: result.rows[0].security_question });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}