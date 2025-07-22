import sys
import requests
import os
import json

# Gupshup API credentials
APP_ID = "dff54050-d905-44a1-94ce-83de05c45c7c"
API_KEY = "sk_ed288ca9e87f4a1eabd73abb7374c225"
SENDER = "+917834811114"

if len(sys.argv) < 4:
    print(json.dumps({"success": False, "error": "Usage: send_whatsapp_gupshup.py <phone> <message> <pdf_path>"}))
    sys.exit(1)

phone = sys.argv[1]
message = sys.argv[2]
pdf_path = sys.argv[3]

if not os.path.exists(pdf_path):
    print(json.dumps({"success": False, "error": "PDF file not found"}))
    sys.exit(1)

# Gupshup API endpoint for media message
url = "https://api.gupshup.io/sm/api/v1/msg"

# Prepare the payload
files = {
    'file': (os.path.basename(pdf_path), open(pdf_path, 'rb'), 'application/pdf')
}
data = {
    'channel': 'whatsapp',
    'source': SENDER,
    'destination': phone,
    'message': message,
    'src.name': 'Rangaa Digitals',
    'appId': APP_ID
}
headers = {
    'apikey': API_KEY
}

try:
    response = requests.post(url, data=data, files=files, headers=headers)
    if response.status_code == 200:
        print(json.dumps({"success": True, "response": response.json()}))
    else:
        print(json.dumps({"success": False, "error": response.text}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)})) 