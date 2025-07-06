import asyncio
import json
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List
from kafka import KafkaProducer
import redis
from pymongo import MongoClient
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import numpy as np
import pandas as pd

# Initialize services
app = FastAPI(title="FinShield Ingestion Service")
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
mongo_client = MongoClient('mongodb://admin:password@localhost:27017/')
db = mongo_client.finshield
transactions_collection = db.transactions

class Transaction(BaseModel):
    card_number: str
    amount: float
    merchant: str
    location: str
    timestamp: str
    user_id: str
    ip_address: str
    device_info: str

class TransactionEvent:
    def __init__(self):
        self.event_id = 0
        
    def generate_realistic_transaction(self) -> Dict:
        """Generate realistic transaction data"""
        self.event_id += 1
        
        # Simulate different risk profiles
        risk_profile = random.choice(['normal', 'suspicious', 'fraudulent'])
        
        if risk_profile == 'normal':
            amount = random.uniform(5, 500)
            location = random.choice(['New York', 'Los Angeles', 'Chicago', 'Houston'])
            merchant = random.choice(['Amazon', 'Starbucks', 'Target', 'Walmart'])
        elif risk_profile == 'suspicious':
            amount = random.uniform(500, 2000)
            location = random.choice(['Miami', 'Las Vegas', 'Atlanta'])
            merchant = random.choice(['Online Casino', 'Luxury Store', 'Cash Advance'])
        else:  # fraudulent
            amount = random.uniform(1000, 10000)
            location = random.choice(['Nigeria', 'Romania', 'Unknown'])
            merchant = random.choice(['Suspicious Merchant', 'Unknown Store', 'Cash Withdrawal'])
        
        return {
            'event_id': self.event_id,
            'card_number': f"****-****-****-{random.randint(1000, 9999)}",
            'amount': round(amount, 2),
            'merchant': merchant,
            'location': location,
            'timestamp': datetime.now().isoformat(),
            'user_id': f"user_{random.randint(1000, 9999)}",
            'ip_address': f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
            'device_info': random.choice(['iPhone 14', 'Samsung Galaxy', 'Chrome Browser', 'Firefox Browser']),
            'risk_profile': risk_profile
        }

transaction_generator = TransactionEvent()

@app.post("/transaction")
async def process_transaction(transaction: Transaction):
    """Process incoming transaction"""
    try:
        # Add timestamp and processing info
        transaction_data = transaction.dict()
        transaction_data['processed_at'] = datetime.now().isoformat()
        transaction_data['processing_time_ms'] = random.uniform(10, 50)
        
        # Store in MongoDB
        result = transactions_collection.insert_one(transaction_data)
        transaction_data['_id'] = str(result.inserted_id)
        
        # Cache in Redis for fast access
        redis_client.setex(f"transaction:{result.inserted_id}", 3600, json.dumps(transaction_data))
        
        # Send to Kafka for downstream processing
        producer.send('transactions', transaction_data)
        
        return {"status": "success", "transaction_id": str(result.inserted_id)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions/recent")
async def get_recent_transactions(limit: int = 50):
    """Get recent transactions"""
    try:
        transactions = list(transactions_collection.find().sort([("_id", -1)]).limit(limit))
        for tx in transactions:
            tx['_id'] = str(tx['_id'])
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

async def simulate_transaction_stream():
    """Simulate real-time transaction stream"""
    while True:
        try:
            # Generate transaction
            transaction = transaction_generator.generate_realistic_transaction()
            
            # Store in MongoDB
            result = transactions_collection.insert_one(transaction)
            transaction['_id'] = str(result.inserted_id)
            
            # Cache in Redis
            redis_client.setex(f"transaction:{result.inserted_id}", 3600, json.dumps(transaction))
            
            # Send to Kafka
            producer.send('transactions', transaction)
            
            # Random delay to simulate real-world timing
            await asyncio.sleep(random.uniform(0.1, 2.0))
            
        except Exception as e:
            print(f"Error in transaction stream: {e}")
            await asyncio.sleep(1)

if __name__ == "__main__":
    # Start background transaction simulation
    asyncio.create_task(simulate_transaction_stream())
    
    # Start FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8001)
