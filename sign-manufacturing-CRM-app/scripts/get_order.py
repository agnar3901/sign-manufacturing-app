#!/usr/bin/env python3
"""
Script to retrieve order data from database by invoice ID.
Called from Next.js API routes to get order information.
"""

import sys
import json
import sqlite3
import os
from datetime import datetime

def to_iso8601(dt_str):
    try:
        return datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S').isoformat() + 'Z'
    except Exception:
        return dt_str

def get_order_by_invoice_id(invoice_id):
    """
    Retrieve order data by invoice ID from SQLite database
    """
    try:
        db_path = "local_server_data/database/signcraft.db"
        
        if not os.path.exists(db_path):
            print(json.dumps({
                'success': False,
                'error': 'Database not found'
            }))
            return None
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT o.*, o.customer_name, o.phone_number, o.email_address
            FROM orders o
            WHERE o.invoice_id = ?
        ''', (invoice_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            columns = [description[0] for description in cursor.description]
            order_data = dict(zip(columns, row))
            
            # Convert to format expected by PDF generator
            formatted_data = {
                'invoice_id': order_data['invoice_id'],
                'customer_name': order_data['customer_name'],
                'phone_number': order_data['phone_number'],
                'email_address': order_data['email_address'],
                'item_type': order_data['item_type'],
                'size': order_data['size'],
                'quantity': order_data['quantity'],
                'rate': float(order_data['rate']),
                'total': float(order_data['total']),
                'delivery_type': order_data['delivery_type'],
                'payment_mode': order_data['payment_mode'],
                'notes': order_data.get('notes', ''),
                'created_at': to_iso8601(order_data.get('created_at', '')),
            }
            
            print(json.dumps({
                'success': True,
                'data': formatted_data
            }))
            return formatted_data
        else:
            print(json.dumps({
                'success': False,
                'error': 'Order not found'
            }))
            return None
            
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python get_order.py <invoice_id>'
        }))
        sys.exit(1)
    
    invoice_id = sys.argv[1]
    get_order_by_invoice_id(invoice_id) 