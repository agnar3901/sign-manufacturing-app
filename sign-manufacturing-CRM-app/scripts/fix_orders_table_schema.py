import sqlite3
import os

DB_PATH = "local_server_data/database/signcraft.db"

# Define the new schema for the orders table with customer info directly
ORDERS_SCHEMA = '''
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email_address TEXT NOT NULL,
    item_type TEXT NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    delivery_type TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    json_file_path TEXT,
    pdf_file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
)
'''

if not os.path.exists(DB_PATH):
    print("Database not found!")
    exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Rename the old table
try:
    cursor.execute("ALTER TABLE orders RENAME TO orders_old")
    print("Renamed old orders table to orders_old.")
except sqlite3.OperationalError as e:
    if "no such table" in str(e):
        print("No existing orders table to rename.")
    else:
        print("Error renaming table:", e)
        conn.close()
        exit(1)

# Create the new table
cursor.execute(ORDERS_SCHEMA)
print("Created new orders table with correct schema.")

# Try to copy data from old table if it exists
try:
    cursor.execute("PRAGMA table_info(orders_old)")
    old_columns = [row[1] for row in cursor.fetchall()]
    # Copy all columns that exist in both old and new, and join with customers for customer info
    if 'customer_id' in old_columns:
        cursor.execute('''
            INSERT INTO orders (
                id, invoice_id, customer_id, customer_name, phone_number, email_address, item_type, size, quantity, rate, total, delivery_type, payment_mode, status, notes, json_file_path, pdf_file_path, created_at, updated_at
            )
            SELECT o.id, o.invoice_id, o.customer_id, c.name, c.phone_number, c.email_address, o.item_type, o.size, o.quantity, o.rate, o.total, o.delivery_type, o.payment_mode, o.status, o.notes, o.json_file_path, o.pdf_file_path, o.created_at, o.updated_at
            FROM orders_old o
            LEFT JOIN customers c ON o.customer_id = c.id
        ''')
        print("Copied data with customer info from old table.")
    else:
        print("No customer_id in old table, cannot copy customer info.")
except Exception as e:
    print("Error copying data from old table:", e)

# Drop the old table
try:
    cursor.execute("DROP TABLE IF EXISTS orders_old")
    print("Dropped old orders table.")
except Exception as e:
    print("Error dropping old table:", e)

conn.commit()
conn.close()
print("Migration complete.") 