import sqlite3
import os

db_path = "local_server_data/database/signcraft.db"
if not os.path.exists(db_path):
    print("Database not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Add updated_at column if it doesn't exist
try:
    cursor.execute("ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    print("Column 'updated_at' added.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column 'updated_at' already exists.")
    else:
        print("Error:", e)

conn.commit()
conn.close() 