const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function createAdminUser() {
  try {
    // Database path
    const dbPath = path.join(__dirname, '..', 'local_server_data', 'database', 'signcraft.db');
    
    // Open database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create users table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if admin already exists
    const existingAdmin = await db.get(
      "SELECT id FROM users WHERE username = 'admin'"
    );

    if (existingAdmin) {
      console.log('Admin user already exists!');
      return;
    }

    // Create admin user
    const adminPassword = 'admin123'; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await db.run(
      "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
      ['admin', hashedPassword, 'System Administrator', 'admin']
    );

    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    await db.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser(); 