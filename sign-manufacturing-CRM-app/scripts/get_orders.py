#!/usr/bin/env python3
"""
Script to retrieve all orders from database.
Called from Next.js API routes to get order history.
"""
import json
import sqlite3
import os
from datetime import datetime, timedelta, timezone
import sys

def to_iso8601(dt_str):
    try:
        return datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S').isoformat() + 'Z'
    except Exception:
        return dt_str

def get_all_orders(mode=None, limit=20, date=None, page=1, search=None, status=None):
    """
    Retrieve all orders from SQLite database with pagination and search
    """
    try:
        db_path = "local_server_data/database/signcraft.db"
        
        if not os.path.exists(db_path):
            print(json.dumps({
                'success': False,
                'error': 'Database not found',
                'orders': [],
                'total': 0
            }))
            return []
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Build base query
        base_query = 'SELECT o.*, o.customer_name, o.phone_number, o.email_address FROM orders o'
        where_clauses = []
        params = []
        
        if mode == "by-date" and date:
            # Simple approach: use the date as-is and let SQLite handle the comparison
            # This assumes the database timestamps are in the same timezone as the query
            start_str = f"{date} 00:00:00"
            end_str = f"{date} 23:59:59"
            
            # Debug logging (commented out for production)
            # print(f"DEBUG: Querying for date: {date}", file=sys.stderr)
            # print(f"DEBUG: Start: {start_str}", file=sys.stderr)
            # print(f"DEBUG: End: {end_str}", file=sys.stderr)
            
            where_clauses.append('(o.created_at >= ? AND o.created_at <= ?)')
            params.append(start_str)
            params.append(end_str)
        
        if search:
            where_clauses.append('(' +
                'o.customer_name LIKE ? OR o.invoice_id LIKE ? OR o.phone_number LIKE ?' +
            ')')
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        
        if status:
            where_clauses.append('o.status = ?')
            params.append(status)
        
        where_sql = ''
        if where_clauses:
            where_sql = ' WHERE ' + ' AND '.join(where_clauses)
        
        # Get total count for pagination (must NOT use LIMIT/OFFSET)
        count_query = f'SELECT COUNT(*) FROM orders o{where_sql}'
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # For pending orders, use a larger limit or no limit
        if status == "pending":
            limit = 1000  # Large limit for pending orders
        
        # Pagination
        offset = (page - 1) * limit
        query = f'{base_query}{where_sql} ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
        params_with_pagination = params + [limit, offset]
        cursor.execute(query, params_with_pagination)
        rows = cursor.fetchall()
        
        conn.close()
        
        orders = []
        for row in rows:
            columns = [description[0] for description in cursor.description]
            order_data = dict(zip(columns, row))
            
            # Convert to format expected by frontend
            formatted_order = {
                'id': order_data['id'],
                'invoiceId': order_data['invoice_id'],
                'customerName': order_data['customer_name'],
                'phoneNumber': order_data['phone_number'],
                'emailAddress': order_data['email_address'],
                'itemType': order_data['item_type'],
                'size': order_data['size'],
                'quantity': order_data['quantity'],
                'rate': float(order_data['rate']),
                'total': float(order_data['total']),
                'deliveryType': order_data['delivery_type'],
                'paymentMode': order_data['payment_mode'],
                'status': order_data['status'],
                'notes': order_data.get('notes', ''),
                'discount': order_data.get('discount'),
                'createdAt': to_iso8601(order_data['created_at']),
                'pdfPath': order_data.get('pdf_file_path', ''),
                'jsonPath': order_data.get('json_file_path', '')
            }
            
            orders.append(formatted_order)
        
        print(json.dumps({
            'success': True,
            'orders': orders,
            'total': total
        }))
        return orders
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'orders': [],
            'total': 0
        }))
        return []

if __name__ == "__main__":
    if len(sys.argv) > 1:
        args = json.loads(sys.argv[1])
        mode = args.get('mode')
        limit = args.get('limit', 20)
        date = args.get('date')
        page = args.get('page', 1)
        search = args.get('search')
        status = args.get('status')
        get_all_orders(mode, limit, date, page, search, status)
    else:
        get_all_orders() 