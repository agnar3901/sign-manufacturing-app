#!/usr/bin/env python3
"""
Script to get current month's stats from the database.
Returns: total orders, revenue, unique customers, pending orders.
"""
import sqlite3
import os
import json
from datetime import datetime

def get_monthly_stats():
    try:
        db_path = "local_server_data/database/signcraft.db"
        if not os.path.exists(db_path):
            print(json.dumps({
                'success': False,
                'error': 'Database not found',
                'stats': {}
            }))
            return
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        now = datetime.now()
        year = now.year
        month = now.month
        # Orders this month
        cursor.execute('''
            SELECT total, discount FROM orders
            WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
        ''', (str(year), f"{month:02d}"))
        rows = cursor.fetchall()
        total_orders = len(rows)
        # Calculate revenue with discount
        revenue = 0
        for total, discount in rows:
            if discount is not None:
                revenue += total - (total * discount / 100)
            else:
                revenue += total
        # Unique customers this month
        cursor.execute('''
            SELECT COUNT(DISTINCT customer_id) FROM orders
            WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
        ''', (str(year), f"{month:02d}"))
        unique_customers = cursor.fetchone()[0]
        # Pending orders this month
        cursor.execute('''
            SELECT COUNT(*) FROM orders
            WHERE status = 'pending' AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
        ''', (str(year), f"{month:02d}"))
        pending_orders = cursor.fetchone()[0]
        conn.close()
        stats = {
            'totalOrders': total_orders,
            'revenue': revenue,
            'customers': unique_customers,
            'pending': pending_orders
        }
        print(json.dumps({
            'success': True,
            'stats': stats
        }))
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'stats': {}
        }))

if __name__ == "__main__":
    get_monthly_stats() 