import asyncio
import json
import time
from datetime import datetime
from kafka import KafkaConsumer
import redis
from pymongo import MongoClient
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import boto3
from model import FraudDetectionModel
import requests

# Initialize services
app = FastAPI(title="FinShield Risk Engine")
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
mongo_client = MongoClient('mongodb://admin:password@localhost:27017/')
db = mongo_client.finshield

# Initialize AWS Fraud Detector (mock for demo)
class AWSFraudDetector:
    def __init__(self):
        self.enabled = False
        try:
            self.client = boto3.client('frauddetector', region_name='us-west-2')
            self.enabled = True
        except:
            print("AWS Fraud Detector not configured, using mock")
    
    def get_prediction(self, transaction):
        """Get prediction from AWS Fraud Detector"""
        if not self.enabled:
            # Mock prediction
            risk_score = hash(str(transaction)) % 100 / 100.0
            return {
                'fraud_probability': risk_score,
                'risk_level': 'HIGH' if risk_score > 0.7 else 'MEDIUM' if risk_score > 0.3 else 'LOW'
            }
        
        # Real AWS API call would go here
        # This is a simplified mock
        return {
            'fraud_probability': 0.5,
            'risk_level': 'MEDIUM'
        }

# Initialize models
ml_model = FraudDetectionModel()
aws_detector = AWSFraudDetector()

# Try to load existing model
try:
    ml_model.load_model('fraud_model.pkl')
    print("Loaded existing ML model")
except:
    print("No existing model found, will train on first batch")

class TransactionPredict(BaseModel):
    transaction: dict

@app.post("/predict")
async def predict_fraud(request: TransactionPredict):
    """Predict fraud risk for a transaction"""
    try:
        transaction = request.transaction
        
        # Get ML model prediction
        ml_prediction = ml_model.predict(transaction)
        
        # Get AWS Fraud Detector prediction
        aws_prediction = aws_detector.get_prediction(transaction)
        
        # Get LLM prediction
        llm_prediction = {'normal': 0.33, 'suspicious': 0.33, 'fraudulent': 0.34}
        try:
            llm_response = requests.post(
                "http://localhost:8004/predict",
                json=transaction,
                timeout=5
            )
            if llm_response.status_code == 200:
                llm_data = llm_response.json()
                llm_prediction = llm_data.get('risk_scores', llm_prediction)
        except:
            pass
        
        # Ensemble prediction
        if 'error' not in ml_prediction:
            ml_scores = ml_prediction['risk_scores']
            
            # Weighted ensemble
            final_scores = {
                'normal': (ml_scores['normal'] * 0.4 + 
                          llm_prediction['normal'] * 0.3 + 
                          (1 - aws_prediction['fraud_probability']) * 0.3),
                'suspicious': (ml_scores['suspicious'] * 0.4 + 
                              llm_prediction['suspicious'] * 0.3 + 
                              aws_prediction['fraud_probability'] * 0.15),
                'fraudulent': (ml_scores['fraudulent'] * 0.4 + 
                              llm_prediction['fraudulent'] * 0.3 + 
                              aws_prediction['fraud_probability'] * 0.3)
            }
            
            # Normalize
            total = sum(final_scores.values())
            final_scores = {k: v/total for k, v in final_scores.items()}
            
            # Determine final prediction
            final_prediction = max(final_scores, key=final_scores.get)
            confidence = max(final_scores.values())
            
            # Risk level
            if final_scores['fraudulent'] > 0.7:
                risk_level = 'HIGH'
            elif final_scores['fraudulent'] > 0.3 or final_scores['suspicious'] > 0.5:
                risk_level = 'MEDIUM'
            else:
                risk_level = 'LOW'
            
            result = {
                'transaction_id': transaction.get('_id', ''),
                'risk_scores': final_scores,
                'prediction': final_prediction,
                'confidence': confidence,
                'risk_level': risk_level,
                'should_block': final_scores['fraudulent'] > 0.7,
                'components': {
                    'ml_model': ml_prediction,
                    'aws_detector': aws_prediction,
                    'llm_model': llm_prediction
                },
                'timestamp': datetime.now().isoformat()
            }
            
            # Store prediction in Redis
            redis_client.setex(
                f"prediction:{transaction.get('_id', '')}",
                3600,
                json.dumps(result)
            )
            
            return result
        
        else:
            return {'error': 'Model prediction failed'}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/recent")
async def get_recent_predictions(limit: int = 50):
    """Get recent predictions"""
    try:
        keys = redis_client.keys("prediction:*")
        predictions = []
        
        for key in keys[:limit]:
            data = redis_client.get(key)
            if data:
                predictions.append(json.loads(data))
        
        return sorted(predictions, key=lambda x: x['timestamp'], reverse=True)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": ml_model.is_trained,
        "aws_detector": aws_detector.enabled,
        "timestamp": datetime.now().isoformat()
    }

async def process_transaction_stream():
    """Process transactions from Kafka stream"""
    consumer = KafkaConsumer(
        'transactions',
        bootstrap_servers=['localhost:9092'],
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    
    for message in consumer:
        try:
            transaction = message.value
            
            # Predict fraud risk
            prediction_request = TransactionPredict(transaction=transaction)
            prediction = await predict_fraud(prediction_request)
            
            # If high risk, send to alert service
            if prediction.get('should_block', False):
                try:
                    requests.post(
                        "http://localhost:8003/alert",
                        json={
                            'transaction': transaction,
                            'prediction': prediction
                        },
                        timeout=5
                    )
                except:
                    pass
            
        except Exception as e:
            print(f"Error processing transaction: {e}")

if __name__ == "__main__":
    # Start background stream processing
    asyncio.create_task(process_transaction_stream())
    
    # Start FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8002)
