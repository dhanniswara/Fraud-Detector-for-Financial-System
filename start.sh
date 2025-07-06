#!/bin/bash

echo "🚀 Starting FinShield Link Fraud Detection System..."

# Start Docker services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 15

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install -r ingestion/requirements.txt
pip install -r llm_training/requirements.txt
pip install -r risk_engine/requirements.txt
pip install -r alert_service/requirements.txt

# Install Node.js dependencies and start dashboard
echo "🌐 Setting up dashboard..."
cd dashboard
yarn install
yarn start &
cd ..

# Start Python services
echo "🔧 Starting Python services..."
python ingestion/ingest.py &
python llm_training/train_llm.py &
python risk_engine/predict.py &
python alert_service/notify.py &

echo "✅ FinShield Link is running!"
echo "🌐 Dashboard: http://localhost:3000"
echo "📊 Ingestion API: http://localhost:8001"
echo "🤖 Risk Engine API: http://localhost:8002"
echo "🚨 Alert Service API: http://localhost:8003"
echo ""
echo "To stop all services, run: docker-compose down && pkill -f python && pkill -f node"
