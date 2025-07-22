import sys
import sqlite3
import os
import json

if len(sys.argv) != 2:
    print(json.dumps({"success": False, "error": "Usage: delete_order.py <invoice_id>"}))
    sys.exit(1)

invoice_id = sys.argv[1]
db_path = "local_server_data/database/signcraft.db"

if not os.path.exists(db_path):
    print(json.dumps({"success": False, "error": "Database not found"}))
    sys.exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM orders WHERE invoice_id = ?", (invoice_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    if affected == 0:
        print(json.dumps({"success": False, "error": "Order not found"}))
    else:
        print(json.dumps({"success": True}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1) 