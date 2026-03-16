import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDb } from './src/lib/db';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'social-orbit-secret-key-123';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// OAuth Configs (Placeholders - users should set these in .env)
const OAUTH_CONFIGS: Record<string, any> = {
  LinkedIn: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    scope: 'r_liteprofile r_emailaddress w_member_social',
  },
  Facebook: {
    authUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v12.0/oauth/access_token',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    scope: 'public_profile,email,pages_manage_posts,pages_read_engagement',
  },
  Instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    scope: 'user_profile,user_media',
  },
  Twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    scope: 'tweet.read tweet.write users.read offline.access',
  },
  TikTok: {
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    scope: 'user.info.basic,video.list,video.upload',
  },
  YouTube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
  }
};

async function startServer() {
  initDb();
  
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
      const info = stmt.run(name, email, hashedPassword, role || 'Team Member');
      res.status(201).json({ id: info.lastInsertRowid, name, email, role });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.patch('/api/users/profile', authenticateToken, async (req: any, res) => {
    const { name, email, password } = req.body;
    try {
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?').run(name, email, hashedPassword, req.user.id);
      } else {
        db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, req.user.id);
      }
      const updatedUser: any = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Client Routes ---
  app.get('/api/clients', authenticateToken, (req: any, res) => {
    const clients = db.prepare('SELECT * FROM clients').all();
    res.json(clients);
  });

  app.post('/api/clients', authenticateToken, (req: any, res) => {
    const { name, niche, tone, target_audience } = req.body;
    const stmt = db.prepare('INSERT INTO clients (name, niche, tone, target_audience, agency_id) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, niche, tone, target_audience, req.user.id);
    res.status(201).json({ id: info.lastInsertRowid, name, niche, tone, target_audience });
  });

  app.delete('/api/clients/:id', authenticateToken, (req, res) => {
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  // --- Post Routes ---
  app.get('/api/posts', authenticateToken, (req, res) => {
    const posts = db.prepare(`
      SELECT posts.*, clients.name as client_name 
      FROM posts 
      JOIN clients ON posts.client_id = clients.id
      ORDER BY scheduled_at ASC
    `).all();
    res.json(posts);
  });

  app.post('/api/posts', authenticateToken, (req: any, res) => {
    const { client_id, title, caption, platformCaptions, hashtags, media_url, platforms, platform, scheduled_at, status, metadata } = req.body;
    
    // Support both single platform (old) and multiple platforms (new)
    const platformList = platforms || [platform];
    
    const stmt = db.prepare(`
      INSERT INTO posts (client_id, title, caption, hashtags, media_url, platform, scheduled_at, status, assigned_to, metadata) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const results = platformList.map((p: string) => {
      const finalCaption = (platformCaptions && platformCaptions[p]) ? platformCaptions[p] : caption;
      const finalMetadata = metadata ? JSON.stringify(metadata) : null;
      const info = stmt.run(client_id, title, finalCaption, hashtags, media_url, p, scheduled_at, status || 'Draft', req.user.id, finalMetadata);
      return { id: info.lastInsertRowid, platform: p };
    });

    res.status(201).json({ results, ...req.body });
  });

  app.patch('/api/posts/:id', authenticateToken, (req, res) => {
    const { status, caption, hashtags, scheduled_at } = req.body;
    const post: any = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const stmt = db.prepare(`
      UPDATE posts SET 
        status = ?, 
        caption = ?, 
        hashtags = ?, 
        scheduled_at = ?
      WHERE id = ?
    `);
    stmt.run(
      status !== undefined ? status : post.status,
      caption !== undefined ? caption : post.caption,
      hashtags !== undefined ? hashtags : post.hashtags,
      scheduled_at !== undefined ? scheduled_at : post.scheduled_at,
      req.params.id
    );
    res.json({ success: true });
  });

  // --- Analytics Routes ---
  app.get('/api/analytics', authenticateToken, (req, res) => {
    // Return some dummy data for charts
    const data = [
      { name: 'Mon', likes: 400, reach: 2400 },
      { name: 'Tue', likes: 300, reach: 1398 },
      { name: 'Wed', likes: 200, reach: 9800 },
      { name: 'Thu', likes: 278, reach: 3908 },
      { name: 'Fri', likes: 189, reach: 4800 },
      { name: 'Sat', likes: 239, reach: 3800 },
      { name: 'Sun', likes: 349, reach: 4300 },
    ];
    res.json(data);
  });

  // --- AI Route ---
  app.post('/api/ai/generate', authenticateToken, async (req, res) => {
    // This will be handled by the frontend calling Gemini directly for simplicity in this environment,
    // but we can also proxy it here if needed.
    // For now, let's just return a placeholder or implement it.
    res.json({ message: "Use the frontend Gemini integration" });
  });

  // --- Integration & OAuth Routes ---
  app.get('/api/auth/url/:platform', authenticateToken, (req: any, res) => {
    const { platform } = req.params;
    const { client_id } = req.query;
    const config = OAUTH_CONFIGS[platform];

    if (!config || !config.clientId) {
      return res.status(400).json({ error: `OAuth not configured for ${platform}` });
    }

    const state = Buffer.from(JSON.stringify({ platform, client_id, user_id: req.user.id })).toString('base64');
    const redirectUri = `${APP_URL}/auth/callback`;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: redirectUri,
      state: state,
      scope: config.scope,
    });

    res.json({ url: `${config.authUrl}?${params.toString()}` });
  });

  app.get('/auth/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send('Missing code or state');

    try {
      const { platform, client_id, user_id } = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const config = OAUTH_CONFIGS[platform];

      // Exchange code for token
      const tokenResponse = await axios.post(config.tokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: `${APP_URL}/auth/callback`,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      const expires_at = expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null;

      // Save to database
      const stmt = db.prepare(`
        INSERT INTO integrations (client_id, platform, access_token, refresh_token, expires_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(client_id, platform) DO UPDATE SET
          access_token = excluded.access_token,
          refresh_token = excluded.refresh_token,
          expires_at = excluded.expires_at
      `);
      stmt.run(client_id, platform, access_token, refresh_token, expires_at);

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: '${platform}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('OAuth Callback Error:', error.response?.data || error.message);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/integrations/:clientId', authenticateToken, (req, res) => {
    const integrations = db.prepare('SELECT platform, platform_user_name, created_at FROM integrations WHERE client_id = ?').all(req.params.clientId);
    res.json(integrations);
  });

  // --- Publishing Route ---
  app.post('/api/posts/:id/publish', authenticateToken, async (req, res) => {
    const post: any = db.prepare(`
      SELECT posts.*, integrations.access_token, integrations.platform as integration_platform
      FROM posts
      JOIN integrations ON posts.client_id = integrations.client_id AND posts.platform = integrations.platform
      WHERE posts.id = ?
    `).get(req.params.id);

    if (!post) return res.status(404).json({ error: 'Post or integration not found' });

    try {
      // MOCK PUBLISHING LOGIC
      console.log(`Publishing to ${post.platform} using token ${post.access_token.substring(0, 10)}...`);
      
      // In a real app, you'd call the platform's API here:
      // if (post.platform === 'LinkedIn') { ... }
      
      db.prepare('UPDATE posts SET status = "Approved" WHERE id = ?').run(req.params.id);
      res.json({ success: true, message: `Published to ${post.platform}` });
    } catch (error: any) {
      res.status(500).json({ error: 'Publishing failed' });
    }
  });

  // --- Advanced Analytics Routes ---
  app.get('/api/analytics', authenticateToken, (req: any, res) => {
    const { client_id, start_date, end_date } = req.query;
    
    // In a real app, you'd fetch real-time data from social APIs here.
    // For this MVP, we return enhanced dummy data based on filters.
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(day => ({
      name: day,
      likes: Math.floor(Math.random() * 500) + 100,
      reach: Math.floor(Math.random() * 5000) + 1000,
      comments: Math.floor(Math.random() * 50) + 5,
      shares: Math.floor(Math.random() * 30) + 2,
      engagement: (Math.random() * 5 + 1).toFixed(2),
    }));
    
    res.json(data);
  });

  // --- Reports Routes ---
  app.get('/api/reports', authenticateToken, (req, res) => {
    const { client_id } = req.query;
    const reports = db.prepare('SELECT * FROM reports WHERE client_id = ? ORDER BY created_at DESC').all(client_id);
    res.json(reports);
  });

  app.post('/api/reports', authenticateToken, (req, res) => {
    const { client_id, name, config } = req.body;
    const stmt = db.prepare('INSERT INTO reports (client_id, name, config) VALUES (?, ?, ?)');
    const info = stmt.run(client_id, name, JSON.stringify(config));
    res.status(201).json({ id: info.lastInsertRowid, name });
  });

  // --- Messages & Conversations Routes ---
  app.get('/api/conversations', authenticateToken, (req, res) => {
    const { client_id } = req.query;
    let query = 'SELECT * FROM conversations';
    let params: any[] = [];
    
    if (client_id) {
      query += ' WHERE client_id = ?';
      params.push(client_id);
    }
    
    query += ' ORDER BY last_message_at DESC';
    const conversations = db.prepare(query).all(...params);
    res.json(conversations);
  });

  app.get('/api/conversations/:id/messages', authenticateToken, (req, res) => {
    const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC').all(req.params.id);
    res.json(messages);
  });

  app.post('/api/conversations/:id/messages', authenticateToken, (req, res) => {
    const { content } = req.body;
    const conversationId = req.params.id;
    
    const stmt = db.prepare('INSERT INTO messages (conversation_id, content, is_from_me) VALUES (?, ?, ?)');
    stmt.run(conversationId, content, 1);
    
    // Update last message in conversation
    db.prepare('UPDATE conversations SET last_message = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(content, conversationId);
      
    res.status(201).json({ success: true });
  });

  app.patch('/api/conversations/:id/read', authenticateToken, (req, res) => {
    db.prepare('UPDATE conversations SET unread_count = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Social Comments Routes ---
  app.get('/api/social-comments', authenticateToken, (req, res) => {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id is required' });
    
    const comments = db.prepare('SELECT * FROM social_comments WHERE client_id = ? ORDER BY timestamp DESC').all(client_id);
    res.json(comments);
  });

  app.post('/api/social-comments/:id/reply', authenticateToken, (req, res) => {
    const { content } = req.body;
    // In a real app, this would call the social media API
    db.prepare('UPDATE social_comments SET is_replied = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, reply: content });
  });

  // --- Competitors Routes ---
  app.get('/api/competitors', authenticateToken, (req, res) => {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id is required' });
    
    const competitors = db.prepare('SELECT * FROM competitors WHERE client_id = ?').all(client_id);
    res.json(competitors);
  });

  app.post('/api/competitors', authenticateToken, (req, res) => {
    const { client_id, name, handle, platform } = req.body;
    const stmt = db.prepare('INSERT INTO competitors (client_id, name, handle, platform) VALUES (?, ?, ?, ?)');
    const info = stmt.run(client_id, name, handle, platform);
    res.status(201).json({ id: info.lastInsertRowid, name });
  });

  // --- Tasks Routes ---
  app.get('/api/tasks', authenticateToken, (req, res) => {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id is required' });
    
    const tasks = db.prepare('SELECT * FROM tasks WHERE client_id = ? ORDER BY start_date ASC').all(client_id);
    res.json(tasks);
  });

  app.post('/api/tasks', authenticateToken, (req: any, res) => {
    const { client_id, title, description, status, start_date, end_date } = req.body;
    const stmt = db.prepare('INSERT INTO tasks (client_id, title, description, status, start_date, end_date, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(client_id, title, description, status || 'Todo', start_date, end_date, req.user.id);
    res.status(201).json({ id: info.lastInsertRowid, title, status: status || 'Todo' });
  });

  app.patch('/api/tasks/:id', authenticateToken, (req, res) => {
    const { status, title, description, start_date, end_date } = req.body;
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (title) { updates.push('title = ?'); params.push(title); }
    if (description) { updates.push('description = ?'); params.push(description); }
    if (start_date) { updates.push('start_date = ?'); params.push(start_date); }
    if (end_date) { updates.push('end_date = ?'); params.push(end_date); }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    params.push(req.params.id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ success: true });
  });

  app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
