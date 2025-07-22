#!/usr/bin/env python3
"""
Order processing script that integrates all the Python functionality.
Called from Next.js API routes to process customer orders.
"""

import sys
import json
import os
import sqlite3
from datetime import datetime
from pdf_generator import generate_invoice_pdf
from messaging_integration import send_all_notifications

def process_order(order_data_json):
    """
    Process a complete order:
    1. Generate PDF invoice
    2. Save to database
    3. Send notifications
    
    Args:
        order_data_json (str): JSON string containing order data
        
    Returns:
        dict: Processing results with success status and file paths
    """
    try:
        # Parse order data
        order_data = json.loads(order_data_json)
        
        # Generate invoice ID if not provided
        if 'invoice_id' not in order_data:
            timestamp = int(datetime.now().timestamp() * 1000)
            random_num = hash(str(order_data)) % 1000
            order_data['invoice_id'] = f"INV_{timestamp}_{random_num}"
        
        # Calculate total if not provided
        if 'total' not in order_data:
            order_data['total'] = order_data['quantity'] * order_data['rate']
        
        # Check if order already exists in the database
        db_path = "local_server_data/database/signcraft.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM orders WHERE invoice_id = ?", (order_data['invoice_id'],))
        exists = cursor.fetchone()[0] > 0
        conn.close()

        # Create date-based directory structure
        today = datetime.now().strftime('%Y-%m-%d')
        output_dir = f"local_server_data/{today}"
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate PDF invoice
        pdf_path = os.path.join(output_dir, f"{order_data['invoice_id']}.pdf")
        generate_invoice_pdf(order_data, pdf_path)
        
        # Save JSON data
        json_path = os.path.join(output_dir, f"{order_data['invoice_id']}.json")
        with open(json_path, 'w') as f:
            json.dump(order_data, f, indent=2, default=str)
        
        # Only insert into database if it does not already exist
        if not exists:
            save_to_database(order_data, pdf_path, json_path)
        
        # Send notifications
        notification_results = send_all_notifications(order_data, pdf_path)
        
        # Return results
        result = {
            'success': True,
            'invoice_id': order_data['invoice_id'],
            'pdf_path': pdf_path,
            'json_path': json_path,
            'notifications': notification_results,
            'message': 'Order processed successfully'
        }
        
        print(json.dumps(result))
        return result
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'message': 'Failed to process order'
        }
        print(json.dumps(error_result))
        return error_result

def save_to_database(order_data, pdf_path, json_path):
    """
    Save order data to SQLite database
    """
    db_path = "local_server_data/database/signcraft.db"
    
    # Ensure database directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            email_address TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
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
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Insert or get customer (keep for foreign key, but do not update name)
    cursor.execute('''
        INSERT OR IGNORE INTO customers (name, phone_number, email_address)
        VALUES (?, ?, ?)
    ''', (order_data['customer_name'], order_data['phone_number'], order_data['email_address']))

    cursor.execute('''
        SELECT id FROM customers 
        WHERE phone_number = ? AND email_address = ?
    ''', (order_data['phone_number'], order_data['email_address']))
    customer_id = cursor.fetchone()[0]

    # Insert order with customer info directly
    cursor.execute('''
        INSERT INTO orders (
            invoice_id, customer_id, customer_name, phone_number, email_address, item_type, size, quantity, rate, total,
            delivery_type, payment_mode, notes, json_file_path, pdf_file_path, material, lamination, discount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        order_data['invoice_id'], customer_id, order_data['customer_name'], order_data['phone_number'], order_data['email_address'],
        order_data['item_type'], order_data['size'], order_data['quantity'], order_data['rate'], order_data['total'],
        order_data['delivery_type'], order_data['payment_mode'], order_data.get('notes', ''), json_path, pdf_path,
        order_data.get('material'),
        order_data.get('lamination'),
        order_data.get('discount')
    ))
    
    conn.commit()
    conn.close()

def get_order_by_invoice_id(invoice_id):
    """
    Retrieve order data by invoice ID
    """
    try:
        db_path = "local_server_data/database/signcraft.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT o.*, c.name as customer_name, c.phone_number, c.email_address
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.invoice_id = ?
        ''', (invoice_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            columns = [description[0] for description in cursor.description]
            order_data = dict(zip(columns, row))
            return order_data
        else:
            return None
            
    except Exception as e:
        print(f"Error retrieving order: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python process_order.py <order_data_json>'
        }))
        sys.exit(1)
    
    order_data_json = sys.argv[1]
    process_order(order_data_json) 