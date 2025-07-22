# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### SMTP Configuration for Email Sending

```bash
# SMTP Server Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# SMTP Authentication
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Custom "From" email address
SMTP_FROM=orders@rangaadigitals.com

# JWT Secret (for authentication)
JWT_SECRET=your-secret-key-change-in-production
```

## SMTP Setup Instructions

### For Gmail:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the generated password as `SMTP_PASS`

### For Outlook/Hotmail:
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### For Yahoo:
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

## Testing Email Configuration

After setting up the environment variables:

1. Restart your development server
2. Create a new order with a valid email address
3. Check the console logs for email sending status
4. The customer should receive an email with the invoice PDF attached

## Troubleshooting

- **"SMTP not configured"**: Check that all SMTP environment variables are set
- **"Invalid email format"**: Ensure the customer email address is valid
- **"PDF file not found"**: The invoice PDF generation must succeed before email sending
- **Authentication failed**: Verify your SMTP credentials, especially app passwords for Gmail 