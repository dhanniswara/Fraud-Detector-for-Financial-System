import asyncio
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import redis
from pymongo import MongoClient
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os
from twilio.rest import Client
import requests

# Initialize services
app = FastAPI(title="FinShield Alert Service")
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
mongo_client = MongoClient('mongodb://admin:password@localhost:27017/')
db = mongo_client.finshield

# Configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', 'demo_sid')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', 'demo_token')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '+1234567890')

SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', 'demo@example.com')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', 'demo_password')

class AlertRequest(BaseModel):
    transaction: dict
    prediction: dict

class NotificationService:
    def __init__(self):
        self.twilio_client = None
        self.email_enabled = False
        
        # Initialize Twilio
        try:
            self.twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            print("Twilio client initialized")
        except:
            print("Twilio not configured, SMS disabled")
        
        # Test email configuration
        try:
            self._test_email_config()
            self.email_enabled = True
            print("Email service enabled")
        except:
            print("Email not configured, email alerts disabled")
    
    def _test_email_config(self):
        """Test email configuration"""
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.quit()
    
    async def send_sms_alert(self, phone_number, message):
        """Send SMS alert"""
        try:
            if not self.twilio_client:
                print(f"SMS Alert (Mock): {phone_number} - {message}")
                return True
            
            message = self.twilio_client.messages.create(
                body=message,
                from_=TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            
            print(f"SMS sent: {message.sid}")
            return True
            
        except Exception as e:
            print(f"Error sending SMS: {e}")
            return False
    
    async def send_email_alert(self, email_address, subject, body):
        """Send email alert"""
        try:
            if not self.email_enabled:
                print(f"Email Alert (Mock): {email_address} - {subject}")
                return True
            
            msg = MIMEMultipart()
            msg['From'] = SMTP_USERNAME
            msg['To'] = email_address
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_USERNAME, email_address, text)
            server.quit()
            
            print(f"Email sent to {email_address}")
            return True
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    async def make_voice_call(self, phone_number, message):
        """Make voice call alert"""
        try:
            if not self.twilio_client:
                print(f"Voice Call (Mock): {phone_number} - {message}")
                return True
            
            # Create TwiML for voice message
            twiml = f"""
            <Response>
                <Say voice="alice">
                    Fraud Alert from FinShield Link. 
                    Suspicious transaction detected. 
                    Amount: {message}
                    Please review immediately.
                </Say>
            </Response>
            """
            
            call = self.twilio_client.calls.create(
                twiml=twiml,
                to=phone_number,
                from_=TWILIO_PHONE_NUMBER
            )
            
            print(f"Voice call initiated: {call.sid}")
            return True
            
        except Exception as e:
            print(f"Error making voice call: {e}")
            return False
    
    async def block_transaction(self, transaction_id):
        """Block transaction (simulate)"""
        try:
            # In real implementation, this would interface with payment processor
            block_info = {
                'transaction_id': transaction_id,
                'blocked_at': datetime.now().isoformat(),
                'reason': 'Fraud detection',
                'status': 'BLOCKED'
            }
            
            # Store in Redis
            redis_client.setex(f"blocked:{transaction_id}", 3600, json.dumps(block_info))
            
            # Store in MongoDB
            db.blocked_transactions.insert_one(block_info)
            
            print(f"Transaction blocked: {transaction_id}")
            return True
            
        except Exception as e:
            print(f"Error blocking transaction: {e}")
            return False

# Initialize notification service
notification_service = NotificationService()

@app.post("/alert")
async def process_alert(alert_request: AlertRequest):
    """Process fraud alert"""
    try:
        transaction = alert_request.transaction
        prediction = alert_request.prediction
        
        transaction_id = transaction.get('_id', 'unknown')
        amount = transaction.get('amount', 0)
        merchant = transaction.get('merchant', 'Unknown')
        risk_score = prediction.get('confidence', 0)
        
        # Block transaction if high risk
        if prediction.get('should_block', False):
            await notification_service.block_transaction(transaction_id)
        
        # Prepare alert messages
        sms_message = f"FRAUD ALERT: ${amount} at {merchant}. Risk: {risk_score:.2%}. Transaction ID: {transaction_id}"
        
        email_subject = f"Fraud Alert - Transaction {transaction_id}"
        email_body = f"""
        <html>
        <body>
            <h2>🚨 Fraud Alert - FinShield Link</h2>
            <p><strong>Transaction Details:</strong></p>
            <ul>
                <li>Amount: ${amount}</li>
                <li>Merchant: {merchant}</li>
                <li>Location: {transaction.get('location', 'Unknown')}</li>
                <li>User ID: {transaction.get('user_id', 'Unknown')}</li>
                <li>Risk Score: {risk_score:.2%}</li>
                <li>Prediction: {prediction.get('prediction', 'Unknown')}</li>
            </ul>
            <p><strong>Action Taken:</strong> {'Transaction BLOCKED' if prediction.get('should_block') else 'Transaction FLAGGED'}</p>
            <p><strong>Timestamp:</strong> {datetime.now().isoformat()}</p>
        </body>
        </html>
        """
        
        # Send notifications (using demo phone/email)
        tasks = []
        
        # SMS Alert
        tasks.append(notification_service.send_sms_alert("+1234567890", sms_message))
        
        # Email Alert
        tasks.append(notification_service.send_email_alert("admin@finshield.com", email_subject, email_body))
        
        # Voice call for high-risk transactions
        if risk_score > 0.8:
            tasks.append(notification_service.make_voice_call("+1234567890", f"${amount} at {merchant}"))
        
        # Execute all notifications
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Store alert in database
        alert_record = {
            'transaction_id': transaction_id,
            'transaction': transaction,
            'prediction': prediction,
            'notifications_sent': {
                'sms': results[0] if len(results) > 0 else False,
                'email': results[1] if len(results) > 1 else False,
                'voice': results[2] if len(results) > 2 else False
            },
            'created_at': datetime.now().isoformat()
        }
        
        db.alerts.insert_one(alert_record)
        
        return {
            'status': 'success',
            'transaction_id': transaction_id,
            'blocked': prediction.get('should_block', False),
            'notifications_sent': alert_record['notifications_sent'],
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts/recent")
async def get_recent_alerts(limit: int = 50):
    """Get recent alerts"""
    try:
        alerts = list(db.alerts.find().sort([("_id", -1)]).limit(limit))
        for alert in alerts:
            alert['_id'] = str(alert['_id'])
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/blocked/recent")
async def get_blocked_transactions(limit: int = 50):
    """Get recently blocked transactions"""
    try:
        blocked = list(db.blocked_transactions.find().sort([("_id", -1)]).limit(limit))
        for item in blocked:
            item['_id'] = str(item['_id'])
        return blocked
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "twilio_enabled": notification_service.twilio_client is not None,
        "email_enabled": notification_service.email_enabled,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
