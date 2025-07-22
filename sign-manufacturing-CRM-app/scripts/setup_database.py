import sqlite3
import os
from datetime import datetime

def setup_database():
    """
    Set up SQLite database for the sign manufacturing application.
    Creates tables for customers, orders, and invoices.
    """
    
    # Create database directory if it doesn't exist
    db_dir = "local_server_data/database"
    os.makedirs(db_dir, exist_ok=True)
    
    # Connect to SQLite database
    db_path = os.path.join(db_dir, "signcraft.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            email_address TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id TEXT UNIQUE NOT NULL,
            customer_id INTEGER,
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
    ''')
    
    # Create invoices table for tracking invoice generation
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id TEXT UNIQUE NOT NULL,
            order_id INTEGER,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_whatsapp BOOLEAN DEFAULT FALSE,
            sent_sms BOOLEAN DEFAULT FALSE,
            sent_email BOOLEAN DEFAULT FALSE,
            whatsapp_sent_at TIMESTAMP,
            sms_sent_at TIMESTAMP,
            email_sent_at TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_orders_invoice_id ON orders(invoice_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email_address)')
    
    # Insert sample data
    sample_customers = [
        ('John Doe', '+91-9876543210', 'john@example.com'),
        ('Jane Smith', '+91-9876543211', 'jane@example.com'),
        ('Mike Johnson', '+91-9876543212', 'mike@example.com'),
        ('Sarah Wilson', '+91-9876543213', 'sarah@example.com'),
        ('David Brown', '+91-9876543214', 'david@example.com')
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO customers (name, phone_number, email_address)
        VALUES (?, ?, ?)
    ''', sample_customers)
    
    sample_orders = [
        ('INV_001', 1, 'Flex Banner', '4x6 feet', 2, 150.00, 300.00, 'Local Pickup', 'Cash', 'completed', 'Rush order for event'),
        ('INV_002', 2, 'Acrylic Sign', '12x18 inches', 1, 500.00, 500.00, 'Delivery', 'UPI', 'processing', ''),
        ('INV_003', 3, 'LED Sign Board', '3x2 feet', 1, 2500.00, 2500.00, 'Local Pickup', 'Online', 'pending', 'Custom LED configuration'),
        ('INV_004', 4, 'Vinyl Sticker', '6x4 inches', 50, 10.00, 500.00, 'Courier', 'Cash', 'delivered', 'Bulk order'),
        ('INV_005', 5, 'Metal Sign', '2x1 feet', 3, 800.00, 2400.00, 'Delivery', 'Card', 'completed', 'Stainless steel finish')
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO orders (invoice_id, customer_id, item_type, size, quantity, rate, total, delivery_type, payment_mode, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', sample_orders)
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print(f"Database setup completed successfully!")
    print(f"Database location: {db_path}")
    print("Tables created: customers, orders, invoices")
    print("Sample data inserted for testing")

if __name__ == "__main__":
    setup_database()
