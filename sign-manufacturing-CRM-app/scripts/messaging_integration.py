import os
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from dotenv import load_dotenv
import subprocess
from PIL import Image, ImageDraw, ImageFont
import tempfile

# Load environment variables from .env file
load_dotenv()

# Configuration (In production, use environment variables)
CONFIG = {
    'email': {
        'smtp_server': 'smtp.gmail.com',
        'smtp_port': 587,
        'username': 'your_email@gmail.com',
        'password': 'your_app_password'
    },
    'msg91': {
        'api_key': 'your_msg91_api_key',
        'sender_id': 'SIGNCRAFT'
    }
}

def send_sms_message(order_data):
    """
    Send SMS using MSG91 API
    """
    try:
        import requests
        api_key = os.environ.get('MSG91_API_KEY')
        sender_id = os.environ.get('MSG91_SENDER_ID', 'SIGNCRAFT')
        to_number = order_data['phone_number']
        
        if not api_key or not to_number:
            print("MSG91 API key or recipient missing.", file=sys.stderr)
            return False
            
        message_body = f"Order {order_data['invoice_id']} confirmed! Total: ₹{order_data['total']:.2f}. Thank you for choosing Rangaa Digitals. Contact: +91-9876543210"
        
        # MSG91 API endpoint
        url = "https://api.msg91.com/api/v5/flow/"
        headers = {
            'Content-Type': 'application/json',
            'Authkey': api_key
        }
        data = {
            'flow_id': 'your_flow_id_here',  # You need to create a flow in MSG91
            'sender': sender_id,
            'mobiles': to_number,
            'VAR1': order_data['invoice_id'],
            'VAR2': f"₹{order_data['total']:.2f}"
        }
        
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"SMS sent to {to_number} via MSG91", file=sys.stderr)
            return True
        else:
            print(f"Failed to send SMS via MSG91: {response.text}", file=sys.stderr)
            return False
            
    except Exception as e:
        import sys
        print(f"Error sending SMS: {e}", file=sys.stderr)
        return False

def send_email_notification(order_data, pdf_path=None):
    """
    Send email notification with PDF attachment
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = CONFIG['email']['username']
        msg['To'] = order_data['email_address']
        msg['Subject'] = f"Order Confirmation - {order_data['invoice_id']} - SignCraft Pro"
        
        # Email body
        body = f"""
Dear {order_data['customer_name']},

Thank you for your order with SignCraft Pro!

ORDER DETAILS:
Invoice ID: {order_data['invoice_id']}
Date: {datetime.now().strftime('%B %d, %Y')}

Item: {order_data['item_type']}
Size: {order_data['size']}
Quantity: {order_data['quantity']}
Rate: ₹{order_data['rate']:.2f}
Total Amount: ₹{order_data['total']:.2f}

Payment Mode: {order_data['payment_mode']}
Delivery Type: {order_data['delivery_type']}

{f"Notes: {order_data['notes']}" if order_data.get('notes') else ""}

Your invoice is attached to this email. Please keep it for your records.

We will process your order and keep you updated on the progress.

For any queries, please contact us:
Phone: +91-9876543210
Email: info@signcraft.com
Website: www.signcraft.com

Thank you for choosing SignCraft Pro!

Best regards,
SignCraft Pro Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach PDF if provided
        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
                
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {order_data["invoice_id"]}.pdf'
            )
            msg.attach(part)
        
        # Send email
        # server = smtplib.SMTP(CONFIG['email']['smtp_server'], CONFIG['email']['smtp_port'])
        # server.starttls()
        # server.login(CONFIG['email']['username'], CONFIG['email']['password'])
        # text = msg.as_string()
        # server.sendmail(CONFIG['email']['username'], order_data['email_address'], text)
        # server.quit()
        
        import sys
        print(f"Email sent to {order_data['email_address']}", file=sys.stderr)
        print(f"Subject: {msg['Subject']}", file=sys.stderr)
        return True
        
    except Exception as e:
        import sys
        print(f"Error sending email: {e}", file=sys.stderr)
        return False

def generate_order_image(order_data):
    """
    Generate a JPG image with order details and return the file path.
    """
    width, height = 600, 400
    img = Image.new('RGB', (width, height), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    y = 20
    lines = [
        f"Rangaa Digitals Invoice",
        f"Invoice ID: {order_data['invoice_id']}",
        f"Customer: {order_data['customer_name']}",
        f"Phone: {order_data['phone_number']}",
        f"Email: {order_data['email_address']}",
        f"Item: {order_data['item_type']} ({order_data['size']})",
        f"Quantity: {order_data['quantity']}",
        f"Rate: ₹{order_data['rate']}",
        f"Total: ₹{order_data['total']}",
        f"Payment: {order_data['payment_mode']}",
        f"Delivery: {order_data['delivery_type']}",
        f"Notes: {order_data.get('notes', '')}",
        f"Thank you for your business!"
    ]
    for line in lines:
        d.text((20, y), line, fill=(0, 0, 0), font=font)
        y += 28
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
    img.save(temp_file.name, 'JPEG')
    return temp_file.name

def send_whatsapp_gupshup(order_data, pdf_path=None):
    """
    Send WhatsApp image with order details using Gupshup API (calls send_whatsapp_gupshup.py)
    """
    try:
        phone = order_data['phone_number']
        # Always format as +91XXXXXXXXXX
        phone = ''.join(filter(str.isdigit, phone))
        if not phone.startswith('91'):
            phone = '91' + phone[-10:]
        phone = '+' + phone[-12:]
        message = f"Thank you for your order! Here is your invoice from Rangaa Digitals. Invoice ID: {order_data['invoice_id']}"
        # Generate image with order details
        image_path = generate_order_image(order_data)
        script_path = os.path.join(os.path.dirname(__file__), 'send_whatsapp_gupshup.py')
        result = subprocess.run([
            'python', script_path, phone, message, image_path
        ], capture_output=True, text=True)
        try:
            return json.loads(result.stdout.strip())
        except Exception:
            return {'success': False, 'error': result.stdout.strip()}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def send_all_notifications(order_data, pdf_path=None):
    """
    Send all notifications (SMS, Email, WhatsApp)
    """
    results = {
        'sms': send_sms_message(order_data),
        'email': send_email_notification(order_data, pdf_path),
        'whatsapp': send_whatsapp_gupshup(order_data, pdf_path)
    }
    import sys
    print(f"Notification results: {results}", file=sys.stderr)
    return results

def test_notifications():
    """Test notifications with sample data"""
    sample_order = {
        'invoice_id': 'INV_TEST_001',
        'customer_name': 'John Doe',
        'phone_number': '+91-9876543210',
        'email_address': 'john@example.com',
        'item_type': 'Flex Banner',
        'size': '4x6 feet',
        'quantity': 2,
        'rate': 150.00,
        'total': 300.00,
        'payment_mode': 'Cash',
        'delivery_type': 'Local Pickup',
        'notes': 'Test order for notification system'
    }
    
    send_all_notifications(sample_order)

if __name__ == "__main__":
    test_notifications()
