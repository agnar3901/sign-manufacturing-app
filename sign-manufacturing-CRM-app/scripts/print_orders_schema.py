import sqlite3

db_path = "local_server_data/database/signcraft.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(orders)")
for row in cursor.fetchall():
    print(row)
conn.close() 