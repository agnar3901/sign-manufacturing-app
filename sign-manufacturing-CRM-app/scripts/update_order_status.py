#!/usr/bin/env python3
"""
Update the status of an order in the database by invoice_id.
Usage: python update_order_status.py <invoice_id> <new_status>
"""
import sys
import sqlite3
import os
import json

def update_order_status(invoice_id, new_status):
    try:
        db_path = "local_server_data/database/signcraft.db"
        if not os.path.exists(db_path):
            print(json.dumps({
                'success': False,
                'error': 'Database not found'
            }))
            return
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE invoice_id = ?
        ''', (new_status, invoice_id))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        if affected == 0:
            print(json.dumps({
                'success': False,
                'error': 'Order not found'
            }))
        else:
            print(json.dumps({ 'success': True }))
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python update_order_status.py <invoice_id> <new_status>'
        }))
        sys.exit(1)
    invoice_id = sys.argv[1]
    new_status = sys.argv[2]
    update_order_status(invoice_id, new_status) 