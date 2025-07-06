@echo off
echo 🚀 Starting FinShield Link Fraud Detection System...

REM Start Docker services
echo 📦 Starting Docker services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to initialize...
timeout /t 15 /nobreak > nul

REM Install Python dependencies
echo 🐍 Installing Python dependencies...
pip install -r ingestion/requirements.txt
pip install -r llm_training/requirements.txt
pip install -r risk_engine/requirements.txt
pip install -r alert_service/requirements.txt

REM Install Node.js dependencies and start dashboard
echo 🌐 Setting up dashboard...
cd dashboard
start /b yarn install
start /b yarn start
cd ..

REM Start Python services
echo 🔧 Starting Python services...
start /b python ingestion/ingest.py
start /b python llm_training/train_llm.py
start /b python risk_engine/predict.py
start /b python alert_service/notify.py

echo ✅ FinShield Link is running!
echo 🌐 Dashboard: http://localhost:3000
echo 📊 Ingestion API: http://localhost:8001
echo 🤖 Risk Engine API: http://localhost:8002
echo 🚨 Alert Service API: http://localhost:8003
echo.
echo To stop all services, run: docker-compose down
pause
