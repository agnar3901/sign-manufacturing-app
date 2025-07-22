#!/usr/bin/env python3
"""
Test script to verify the Python integration works correctly.
This script tests the order processing pipeline.
"""

import json
import sys
import os

# Add the scripts directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from process_order import process_order

def test_order_processing():
    """Test the complete order processing pipeline"""
    
    # Sample order data
    test_order = {
        'customer_name': 'Test Customer',
        'phone_number': '+91-9876543210',
        'email_address': 'test@example.com',
        'item_type': 'Flex Banner',
        'size': '4x6 feet',
        'quantity': 2,
        'rate': 150.00,
        'total': 300.00,
        'delivery_type': 'Local Pickup',
        'payment_mode': 'Cash',
        'notes': 'Test order for integration verification'
    }
    
    print("Testing order processing pipeline...")
    print(f"Input order data: {json.dumps(test_order, indent=2)}")
    print("-" * 50)
    
    # Process the order
    result = process_order(json.dumps(test_order))
    
    print("-" * 50)
    print("Processing result:")
    print(json.dumps(result, indent=2))
    
    if result.get('success'):
        print("\n✅ Integration test PASSED!")
        print(f"✅ Invoice ID: {result.get('invoice_id')}")
        print(f"✅ PDF generated: {result.get('pdf_path')}")
        print(f"✅ JSON saved: {result.get('json_path')}")
        print(f"✅ Notifications: {result.get('notifications')}")
        
        # Check if files actually exist
        if os.path.exists(result.get('pdf_path', '')):
            print("✅ PDF file exists")
        else:
            print("❌ PDF file not found")
            
        if os.path.exists(result.get('json_path', '')):
            print("✅ JSON file exists")
        else:
            print("❌ JSON file not found")
            
    else:
        print("\n❌ Integration test FAILED!")
        print(f"Error: {result.get('error')}")

if __name__ == "__main__":
    test_order_processing() 