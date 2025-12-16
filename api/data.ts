import { sql } from '@vercel/postgres';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'POST') {
      const { username, data } = req.body;
      if (!username || !data) return res.status(400).json({ error: 'Missing requirements' });

      // Save JSON blob
      await sql`
        UPDATE users 
        SET data = ${data} 
        WHERE username = ${username}
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const { username } = req.query;
      if (!username) return res.status(400).json({ error: 'Username required' });

      const result = await sql`SELECT data FROM users WHERE username = ${username}`;
      
      if (result.rows.length > 0) {
        return res.status(200).json(result.rows[0].data);
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}