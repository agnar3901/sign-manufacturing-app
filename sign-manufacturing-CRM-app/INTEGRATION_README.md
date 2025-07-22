# Rangaa Digitals Python-Next.js Integration

This document explains how the Python backend scripts are integrated with the Next.js frontend.

## 🏗️ Architecture Overview

The application uses a hybrid architecture where:
- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend Logic**: Python scripts for PDF generation, database operations, and messaging
- **Integration**: Node.js subprocess calls to Python scripts
- **Storage**: Local file system with SQLite database

## 📁 File Structure

```
sign-manufacturing-app-new/
├── app/api/orders/
│   ├── route.ts                    # Main order API (calls Python)
│   ├── database/route.ts           # Database query API
│   └── [invoiceId]/print/route.ts  # PDF download API
├── scripts/
│   ├── pdf_generator.py            # PDF invoice generation
│   ├── setup_database.py           # Database initialization
│   ├── messaging_integration.py    # WhatsApp/SMS/Email sending
│   ├── process_order.py            # Main integration script
│   ├── get_order.py                # Retrieve single order
│   ├── get_orders.py               # Retrieve all orders
│   └── test_integration.py         # Integration testing
└── local_server_data/
    ├── database/signcraft.db       # SQLite database
    └── YYYY-MM-DD/                 # Daily invoice folders
        ├── INV_XXXX.pdf
        └── INV_XXXX.json
```

## 🔄 Integration Flow

### 1. Order Submission
```
Frontend Form → Next.js API → Python Script → Database + PDF + Notifications
```

1. User submits order form in `customer-order-form.tsx`
2. Form data sent to `/api/orders` (POST)
3. API calls `scripts/process_order.py` via subprocess
4. Python script:
   - Generates PDF using `pdf_generator.py`
   - Saves to database using SQLite
   - Sends notifications using `messaging_integration.py`
5. Returns success/error to frontend
6. Frontend shows toast notification with results

### 2. PDF Download
```
Frontend Download Button → Next.js API → File System → PDF Response
```

1. User clicks download button
2. Request sent to `/api/orders/[invoiceId]/print`
3. API checks if PDF exists in `local_server_data/YYYY-MM-DD/`
4. If not found, retrieves order data and regenerates PDF
5. Returns PDF file as response

### 3. Order History
```
Frontend Component → Next.js API → Python Script → Database → Orders List
```

1. `order-history.tsx` loads on page load
2. Fetches orders from `/api/orders/database`
3. API calls `scripts/get_orders.py` to query database
4. Returns formatted order list to frontend

## 🐍 Python Scripts

### process_order.py
Main integration script that orchestrates the entire order processing:
- **Input**: JSON string with order data
- **Output**: JSON with success status and file paths
- **Functions**:
  - Generate PDF invoice
  - Save JSON data
  - Insert into SQLite database
  - Send notifications

### get_order.py
Retrieves single order by invoice ID:
- **Input**: Invoice ID as command line argument
- **Output**: JSON with order data or error

### get_orders.py
Retrieves all orders from database:
- **Input**: None
- **Output**: JSON array of all orders

## 🔧 API Endpoints

### POST /api/orders
Creates new order and processes it through Python pipeline.

**Request Body:**
```json
{
  "customerName": "John Doe",
  "phoneNumber": "+91-9876543210",
  "emailAddress": "john@example.com",
  "itemType": "flex",
  "size": "4x6 feet",
  "quantity": 2,
  "rate": 150,
  "deliveryType": "pickup",
  "paymentMode": "cash",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "invoiceId": "INV_1234567890_123",
  "pdfPath": "local_server_data/2024-01-15/INV_1234567890_123.pdf",
  "notifications": {
    "sms": true,
    "email": true
  },
  "message": "Order created successfully and invoice sent to customer"
}
```

### GET /api/orders/database
Retrieves all orders from SQLite database.

### GET /api/orders/[invoiceId]/print
Downloads PDF invoice for specific order.

## 🚀 Setup Instructions

1. **Install Python Dependencies:**
   ```bash
   cd scripts
   pip install -r requirements.txt
   ```

2. **Initialize Database:**
   ```bash
   python scripts/setup_database.py
   ```

3. **Test Integration:**
   ```bash
   python scripts/test_integration.py
   ```

4. **Start Next.js Development Server:**
   ```bash
   npm run dev
   ```

## 🔍 Testing

### Manual Testing
1. Fill out customer order form
2. Submit order
3. Check for success toast with notification status
4. Verify PDF download works
5. Check order appears in order history

### Automated Testing
Run the integration test script:
```bash
python scripts/test_integration.py
```

## 🐛 Troubleshooting

### Common Issues

1. **Python script not found:**
   - Ensure Python is installed and in PATH
   - Check script paths are correct

2. **Database errors:**
   - Run `setup_database.py` to initialize database
   - Check file permissions for database directory

3. **PDF generation fails:**
   - Install required Python packages (reportlab, pillow)
   - Check output directory permissions

4. **Notifications not working:**
   - Configure API keys in `messaging_integration.py`
   - Check network connectivity

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export DEBUG=true
```

## 📝 Configuration

### Environment Variables
Create `.env.local` file:
```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# MSG91 Configuration (Alternative SMS)
MSG91_API_KEY=your_api_key
MSG91_SENDER_ID=SIGNCRAFT
```

## 🔒 Security Notes

- API keys should be stored in environment variables
- Database file should have restricted permissions
- PDF files should be validated before serving
- Input validation should be done on both frontend and backend

## 📈 Performance Considerations

- Python subprocess calls add latency (~100-500ms)
- Consider caching frequently accessed data
- Database queries are optimized with indexes
- PDF generation is done asynchronously

## 🔄 Future Improvements

1. **Real-time Updates**: WebSocket integration for live order status
2. **File Upload**: Customer file upload for custom designs
3. **Payment Integration**: Online payment processing
4. **Analytics**: Order analytics and reporting
5. **Multi-language**: Internationalization support 

---

## How to Fix

### 1. Only Print JSON in Python Scripts
- Make sure that in `process_order.py` (and any script called by the API), the **only thing printed to stdout is the final JSON result**.
- All debug prints, logs, or errors should go to `stderr` (using `print(..., file=sys.stderr)`), or be removed/commented out.

### 2. Check for Debug Prints
- In your test run, the integration script printed a lot of debug info (e.g., "PDF invoice generated: ...", "WhatsApp message sent to ...", etc.).
- These print statements will break the JSON parsing in Node.js.

**Example of what you should NOT have:**
```python
print("PDF invoice generated: ...")  # This will break the API!
```

**What you SHOULD have:**
```python
import sys
print(f"PDF invoice generated: {output_path}", file=sys.stderr)
```
Or just comment it out.

---

## Quick Fix Example

**Change this:**
```python
print(f"PDF invoice generated: {output_path}")
```
**To this:**
```python
import sys
print(f"PDF invoice generated: {output_path}", file=sys.stderr)
```
Or just comment it out.

---

## Next Steps

1. **Edit your Python scripts** to ensure only the final result is printed to stdout.
2. **Restart your Next.js server** (if needed).
3. **Try submitting the order again**.

Would you like me to show you exactly what to change in your scripts? 