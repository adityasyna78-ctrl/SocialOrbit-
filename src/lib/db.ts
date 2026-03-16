import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { subMinutes } from 'date-fns';

const db = new Database('social_orbit.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('Admin', 'Team Member', 'Client')) NOT NULL DEFAULT 'Team Member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      niche TEXT,
      tone TEXT,
      target_audience TEXT,
      agency_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agency_id) REFERENCES users(id)
    )
  `);

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      caption TEXT,
      hashtags TEXT,
      media_url TEXT,
      platform TEXT CHECK(platform IN ('Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube')) NOT NULL,
      title TEXT,
      metadata TEXT, -- JSON string for platform-specific metadata
      scheduled_at DATETIME,
      status TEXT CHECK(status IN ('Draft', 'Scheduled', 'Approved', 'Rejected', 'Pending Approval')) DEFAULT 'Draft',
      assigned_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);

  // Approvals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('Approved', 'Rejected')) NOT NULL,
      comments TEXT,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Analytics (Dummy metrics)
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      likes INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      reach INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

  // Integrations table for OAuth tokens
  db.exec(`
    CREATE TABLE IF NOT EXISTS integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at DATETIME,
      platform_user_id TEXT,
      platform_user_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_id, platform),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // Reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      config TEXT, -- JSON string of report configuration
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // Conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      platform_user_id TEXT NOT NULL,
      platform_user_name TEXT NOT NULL,
      platform_user_avatar TEXT,
      last_message TEXT,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      unread_count INTEGER DEFAULT 0,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_from_me BOOLEAN DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
  `);

  // Competitors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      platform TEXT NOT NULL,
      followers INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      last_post_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized');
  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    // Seed Admin
    const userStmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    userStmt.run('Admin User', 'admin@socialorbit.com', hashedPassword, 'Admin');
    
    // Seed Client
    const clientStmt = db.prepare('INSERT INTO clients (name, niche, tone, target_audience, agency_id) VALUES (?, ?, ?, ?, ?)');
    clientStmt.run('Fitness Pro', 'Fitness', 'Energetic & Motivating', 'Young adults 18-35', 1);
    clientStmt.run('Gourmet Eats', 'Food', 'Sophisticated & Elegant', 'Foodies and home cooks', 1);
    
    // Seed Posts
    const postStmt = db.prepare('INSERT INTO posts (client_id, caption, platform, scheduled_at, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?)');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    postStmt.run(1, 'Get ready for our summer challenge! 🏋️‍♂️', 'Instagram', tomorrow.toISOString(), 'Scheduled', 1);

    // Seed Conversations
    const convStmt = db.prepare(`
      INSERT INTO conversations (client_id, platform, platform_user_id, platform_user_name, platform_user_avatar, last_message, last_message_at, unread_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    convStmt.run(1, 'Instagram', 'user_123', 'Alex Rivera', 'https://i.pravatar.cc/150?u=alex', 'Hey, what are the prices for the summer challenge?', new Date().toISOString(), 1);
    convStmt.run(1, 'Facebook', 'user_456', 'Sarah Chen', 'https://i.pravatar.cc/150?u=sarah', 'Thanks for the tips!', new Date().toISOString(), 0);
    convStmt.run(2, 'LinkedIn', 'user_789', 'Michael Scott', 'https://i.pravatar.cc/150?u=michael', 'Interesting post about gourmet food.', new Date().toISOString(), 2);

    // Seed Messages
    const msgStmt = db.prepare(`
      INSERT INTO messages (conversation_id, content, is_from_me, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    // Conversation 1
    msgStmt.run(1, 'Hello! I saw your post about the summer challenge.', 0, subMinutes(new Date(), 10).toISOString());
    msgStmt.run(1, 'Hey, what are the prices for the summer challenge?', 0, subMinutes(new Date(), 5).toISOString());

    // Conversation 2
    msgStmt.run(2, 'Great content as always!', 0, subMinutes(new Date(), 60).toISOString());
    msgStmt.run(2, 'Thanks for the tips!', 0, subMinutes(new Date(), 30).toISOString());

    // Seed Competitors
    const compStmt = db.prepare(`
      INSERT INTO competitors (client_id, name, handle, platform, followers, engagement_rate, last_post_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    compStmt.run(1, 'FitPro Elite', '@fitpro_elite', 'Instagram', 12500, 4.2, subMinutes(new Date(), 1440).toISOString());
    compStmt.run(1, 'GymShark', '@gymshark', 'Instagram', 5000000, 2.1, subMinutes(new Date(), 300).toISOString());
    db.prepare('INSERT INTO competitors (client_id, name, handle, platform, followers, engagement_rate, last_post_date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(2, 'The Gourmet Kitchen', '@gourmet_kitchen', 'Instagram', 8500, 5.5, subMinutes(new Date(), 720).toISOString());

    // Seed Social Comments
    db.exec(`
      CREATE TABLE IF NOT EXISTS social_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        platform_post_id TEXT NOT NULL,
        platform_comment_id TEXT NOT NULL,
        platform_user_id TEXT NOT NULL,
        platform_user_name TEXT NOT NULL,
        platform_user_avatar TEXT,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_replied BOOLEAN DEFAULT 0,
        post_caption_preview TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    const commentStmt = db.prepare(`
      INSERT INTO social_comments (client_id, platform, platform_post_id, platform_comment_id, platform_user_id, platform_user_name, platform_user_avatar, content, timestamp, post_caption_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    commentStmt.run(1, 'Instagram', 'post_999', 'comm_1', 'user_abc', 'FitnessLover', 'https://i.pravatar.cc/150?u=abc', 'Love this workout! Can you do a leg day version?', new Date().toISOString(), 'Get ready for our summer challenge! 🏋️‍♂️');
    commentStmt.run(1, 'Facebook', 'post_888', 'comm_2', 'user_def', 'John Doe', 'https://i.pravatar.cc/150?u=def', 'This is exactly what I needed today. Thanks!', new Date().toISOString(), '5 Tips for a better morning routine ☀️');

    // Seed Tasks
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
        start_date DATETIME,
        end_date DATETIME,
        assigned_to INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )
    `);

    const taskStmt = db.prepare(`
      INSERT INTO tasks (client_id, title, description, status, start_date, end_date, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    taskStmt.run(1, 'Design Summer Campaign Assets', 'Create 10 Instagram posts and 5 stories', 'In Progress', today.toISOString(), nextWeek.toISOString(), 1);
    taskStmt.run(1, 'Schedule July Content', 'Upload all approved posts to the calendar', 'Todo', today.toISOString(), today.toISOString(), 1);
    taskStmt.run(1, 'Monthly Analytics Report', 'Prepare the performance report for June', 'Done', today.toISOString(), today.toISOString(), 1);
    taskStmt.run(2, 'Update Menu Photos', 'Take new photos of the summer menu items', 'Todo', today.toISOString(), nextWeek.toISOString(), 1);

    console.log('Sample data seeded');
  }
}

export default db;
