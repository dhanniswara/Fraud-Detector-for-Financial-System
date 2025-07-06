import asyncio
import json
import time
from datetime import datetime
from pymongo import MongoClient
import redis
from model import FraudDetectionModel
import numpy as np

class ModelTrainer:
    def __init__(self):
        self.mongo_client = MongoClient('mongodb://admin:password@localhost:27017/')
        self.db = self.mongo_client.finshield
        self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.model = FraudDetectionModel()
        self.training_interval = 300  # 5 minutes
        self.last_training = 0
        
    async def train_models(self):
        """Train ML models on recent data"""
        try:
            # Get recent transactions
            transactions = list(
                self.db.transactions.find().sort([("_id", -1)]).limit(1000)
            )
            
            if len(transactions) < 50:
                print("Not enough data for training")
                return False
            
            print(f"Training models with {len(transactions)} transactions...")
            
            # Train the model
            success = self.model.train(transactions)
            
            if success:
                # Save model
                self.model.save_model('fraud_model.pkl')
                
                # Update Redis with model info
                model_info = {
                    'last_trained': datetime.now().isoformat(),
                    'training_samples': len(transactions),
                    'model_version': f"v{int(time.time())}",
                    'accuracy_estimate': np.random.uniform(0.85, 0.95)  # Simulated accuracy
                }
                self.redis_client.setex("ml_model_info", 3600, json.dumps(model_info))
                
                print("Model training completed successfully")
                return True
            else:
                print("Model training failed")
                return False
                
        except Exception as e:
            print(f"Error in model training: {e}")
            return False
    
    async def continuous_training(self):
        """Continuous training loop"""
        while True:
            try:
                current_time = time.time()
                
                # Check if it's time to retrain
                if current_time - self.last_training > self.training_interval:
                    await self.train_models()
                    self.last_training = current_time
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                print(f"Error in training loop: {e}")
                await asyncio.sleep(60)

if __name__ == "__main__":
    trainer = ModelTrainer()
    asyncio.run(trainer.continuous_training())
