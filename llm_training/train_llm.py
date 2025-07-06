import asyncio
import json
import time
from datetime import datetime
import torch
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    TrainingArguments, Trainer, pipeline
)
from datasets import Dataset
import pandas as pd
from kafka import KafkaConsumer
import redis
from pymongo import MongoClient
from fastapi import FastAPI
import uvicorn
import numpy as np

# Initialize services
app = FastAPI(title="FinShield LLM Training Service")
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
mongo_client = MongoClient('mongodb://admin:password@localhost:27017/')
db = mongo_client.finshield

class FraudLLMTrainer:
    def __init__(self):
        self.model_name = "distilbert-base-uncased"
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name, num_labels=3  # normal, suspicious, fraudulent
        )
        self.training_data = []
        self.batch_size = 16
        self.last_training = time.time()
        self.training_interval = 300  # 5 minutes
        
    def preprocess_transaction(self, transaction):
        """Convert transaction to text for LLM processing"""
        text = f"Transaction: ${transaction['amount']} at {transaction['merchant']} " \
               f"in {transaction['location']} using {transaction['device_info']} " \
               f"from IP {transaction['ip_address']}"
        return text
    
    def get_label(self, risk_profile):
        """Convert risk profile to label"""
        mapping = {'normal': 0, 'suspicious': 1, 'fraudulent': 2}
        return mapping.get(risk_profile, 0)
    
    def prepare_training_data(self, transactions):
        """Prepare data for training"""
        texts = []
        labels = []
        
        for tx in transactions:
            text = self.preprocess_transaction(tx)
            label = self.get_label(tx.get('risk_profile', 'normal'))
            texts.append(text)
            labels.append(label)
        
        return Dataset.from_dict({
            'text': texts,
            'labels': labels
        })
    
    def tokenize_function(self, examples):
        """Tokenize text for model input"""
        return self.tokenizer(
            examples['text'],
            truncation=True,
            padding=True,
            max_length=512
        )
    
    async def incremental_training(self):
        """Perform incremental training on new data"""
        try:
            # Get recent transactions for training
            recent_transactions = list(
                db.transactions.find().sort([("_id", -1)]).limit(100)
            )
            
            if len(recent_transactions) < 10:
                return
            
            # Prepare training data
            dataset = self.prepare_training_data(recent_transactions)
            tokenized_dataset = dataset.map(self.tokenize_function, batched=True)
            
            # Training arguments
            training_args = TrainingArguments(
                output_dir="./fraud_model",
                learning_rate=2e-5,
                per_device_train_batch_size=8,
                num_train_epochs=1,
                weight_decay=0.01,
                logging_dir="./logs",
                save_strategy="no"
            )
            
            # Create trainer
            trainer = Trainer(
                model=self.model,
                args=training_args,
                train_dataset=tokenized_dataset,
                tokenizer=self.tokenizer,
            )
            
            # Train the model
            trainer.train()
            
            # Save model state in Redis
            model_info = {
                'last_trained': datetime.now().isoformat(),
                'training_samples': len(recent_transactions),
                'model_version': f"v{int(time.time())}"
            }
            redis_client.setex("llm_model_info", 3600, json.dumps(model_info))
            
            print(f"LLM training completed: {len(recent_transactions)} samples")
            
        except Exception as e:
            print(f"Error in LLM training: {e}")
    
    async def predict_fraud_risk(self, transaction_text):
        """Predict fraud risk using trained model"""
        try:
            # Create classifier pipeline
            classifier = pipeline(
                "text-classification",
                model=self.model,
                tokenizer=self.tokenizer,
                return_all_scores=True
            )
            
            # Get prediction
            results = classifier(transaction_text)
            
            # Format results
            risk_scores = {
                'normal': 0.0,
                'suspicious': 0.0,
                'fraudulent': 0.0
            }
            
            labels = ['normal', 'suspicious', 'fraudulent']
            for i, result in enumerate(results[0]):
                risk_scores[labels[i]] = result['score']
            
            return risk_scores
            
        except Exception as e:
            print(f"Error in fraud prediction: {e}")
            return {'normal': 0.33, 'suspicious': 0.33, 'fraudulent': 0.34}

# Initialize trainer
llm_trainer = FraudLLMTrainer()

@app.post("/predict")
async def predict_transaction(transaction: dict):
    """Predict fraud risk for a transaction"""
    try:
        text = llm_trainer.preprocess_transaction(transaction)
        risk_scores = await llm_trainer.predict_fraud_risk(text)
        
        return {
            "transaction_id": transaction.get('_id'),
            "risk_scores": risk_scores,
            "prediction": max(risk_scores, key=risk_scores.get),
            "confidence": max(risk_scores.values()),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        return {"error": str(e)}

@app.get("/model/info")
async def get_model_info():
    """Get model information"""
    try:
        info = redis_client.get("llm_model_info")
        if info:
            return json.loads(info)
        return {"status": "Model not trained yet"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

async def training_loop():
    """Continuous training loop"""
    while True:
        try:
            current_time = time.time()
            
            # Check if it's time to retrain
            if current_time - llm_trainer.last_training > llm_trainer.training_interval:
                await llm_trainer.incremental_training()
                llm_trainer.last_training = current_time
            
            await asyncio.sleep(60)  # Check every minute
            
        except Exception as e:
            print(f"Error in training loop: {e}")
            await asyncio.sleep(60)

if __name__ == "__main__":
    # Start background training loop
    asyncio.create_task(training_loop())
    
    # Start FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8004)
