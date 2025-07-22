import sqlite3

db_path = "local_server_data/database/signcraft.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Add new columns if they don't exist
try:
    cursor.execute("ALTER TABLE orders ADD COLUMN material TEXT")
except Exception as e:
    print("material column:", e)
try:
    cursor.execute("ALTER TABLE orders ADD COLUMN lamination BOOLEAN")
except Exception as e:
    print("lamination column:", e)
try:
    cursor.execute("ALTER TABLE orders ADD COLUMN discount DECIMAL(5,2)")
except Exception as e:
    print("discount column:", e)

conn.commit()
conn.close()
print("Migration complete.") 