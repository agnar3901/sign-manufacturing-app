#!/usr/bin/env python3
"""
Test script to verify SMTP configuration
Run this script to test if your email settings are working correctly
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import json

def test_smtp_connection():
    """Test SMTP connection and authentication"""
    try:
        # Get SMTP settings from environment variables
        smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER', '')
        smtp_pass = os.getenv('SMTP_PASS', '')
        smtp_secure = os.getenv('SMTP_SECURE', 'false').lower() == 'true'
        
        print(f"Testing SMTP connection to {smtp_host}:{smtp_port}")
        print(f"Username: {smtp_user}")
        print(f"Secure: {smtp_secure}")
        
        if not smtp_user or not smtp_pass:
            print("❌ SMTP_USER or SMTP_PASS not set in environment variables")
            return False
        
        # Create SMTP connection
        if smtp_secure:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
        
        # Login
        server.login(smtp_user, smtp_pass)
        print("✅ SMTP connection and authentication successful!")
        
        server.quit()
        return True
        
    except Exception as e:
        print(f"❌ SMTP connection failed: {str(e)}")
        return False

def test_email_sending():
    """Test sending a simple email"""
    try:
        # Get SMTP settings
        smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER', '')
        smtp_pass = os.getenv('SMTP_PASS', '')
        smtp_secure = os.getenv('SMTP_SECURE', 'false').lower() == 'true'
        smtp_from = os.getenv('SMTP_FROM', smtp_user)
        
        # Test email details
        test_to = input("Enter test email address to send to: ").strip()
        if not test_to:
            print("❌ No email address provided")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = test_to
        msg['Subject'] = "SMTP Test - Rangaa Digitals"
        
        body = """
        This is a test email from Rangaa Digitals order management system.
        
        If you receive this email, your SMTP configuration is working correctly!
        
        Best regards,
        Rangaa Digitals Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        if smtp_secure:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
        
        server.login(smtp_user, smtp_pass)
        text = msg.as_string()
        server.sendmail(smtp_from, test_to, text)
        server.quit()
        
        print(f"✅ Test email sent successfully to {test_to}!")
        return True
        
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== SMTP Configuration Test ===\n")
    
    # Test connection first
    if test_smtp_connection():
        print("\n=== Connection Test Passed ===\n")
        
        # Ask if user wants to test email sending
        test_send = input("Do you want to test sending an email? (y/n): ").strip().lower()
        if test_send == 'y':
            test_email_sending()
    else:
        print("\n=== Connection Test Failed ===")
        print("Please check your SMTP configuration in .env.local file")
        print("Common issues:")
        print("- For Gmail: Make sure you're using an App Password, not your regular password")
        print("- Check that SMTP_HOST, SMTP_USER, and SMTP_PASS are set correctly")
        print("- Verify that 2-factor authentication is enabled for Gmail") 