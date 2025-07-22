import sqlite3
import bcrypt
import os
from pathlib import Path

def create_admin_user():
    try:
        # Database path
        db_path = Path(__file__).parent.parent / "local_server_data" / "database" / "signcraft.db"
        
        # Ensure database directory exists
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create users table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Check if admin already exists
        cursor.execute("SELECT id FROM users WHERE username = ?", ('admin',))
        existing_admin = cursor.fetchone()
        
        if existing_admin:
            print('Admin user already exists!')
            return
        
        # Create admin user
        admin_password = 'admin123'  # Change this to your desired password
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt(12))
        
        cursor.execute(
            "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
            ('admin', hashed_password.decode('utf-8'), 'System Administrator', 'admin')
        )
        
        conn.commit()
        
        print('✅ Admin user created successfully!')
        print('Username: admin')
        print('Password: admin123')
        print('⚠️  Please change the password after first login!')
        
        conn.close()
        
    except Exception as error:
        print(f'Error creating admin user: {error}')

if __name__ == "__main__":
    create_admin_user() 