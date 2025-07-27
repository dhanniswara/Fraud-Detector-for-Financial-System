## System Features:

- ✅ One-Click Deployment: Run ```./start.sh``` or ```start.bat``` to launch everything
- ✅ Real-time Transaction Ingestion: FastAPI service capturing card events with MongoDB/Redis storage
- ✅ Hybrid ML Risk Engine: LSTM + Random Forest + AWS Fraud Detector + Graph ML ensemble
- ✅ LLM Fine-tuning: Incremental training on streaming transaction patterns
- ✅ Multi-channel Alerts: SMS, Email, Voice calls via Twilio integration
- ✅ Interactive Dashboard: React-powered UI with live charts, transaction feeds, and system control
- ✅ Dockerized Infrastructure: Kafka, MongoDB, Redis auto-provisioned
- ✅ Health Monitoring: Real-time service status and system logs

## Quick Start Instructions:
```bash
# Clone the repository
git clone <your-repo-url>
cd finshield-link

# Make scripts executable (Linux/Mac)
chmod +x start.sh

# Launch everything with one command
./start.sh

# Or on Windows
start.bat
```

## System Explanation:
1. Docker services start: Kafka, MongoDB, Redis spin up
2. Python dependencies install: All ML/API libraries get installed
3. Dashboard builds: React app compiles and starts on port 3000
4. Services launch: All 4 microservices start in parallel
  - Ingestion API (port 8001)
  - Risk Engine (port 8002)
  - Alert Service (port 8003)
  - LLM Training (port 8004)
5. Live simulation begins: Realistic transactions start flowing through the system

## Dashboard Features:

- 📊 Real-time Dashboard: Live transaction metrics, risk distribution charts
- 💳 Transaction Feed: Streaming transaction list with risk scores
- 🎯 Risk Analysis: Scatter plots, model performance comparisons
- 🚨 Alert Panel: Active fraud alerts and blocked transactions
- ⚙ System Control: Start/stop pipeline, view logs, health monitoring

## Architecture Highlights:

- Event-driven: Kafka streams connect all services
- ML Ensemble: Multiple models vote on fraud probability
- Incremental Learning: LLM continuously improves on new data
- Graph Analytics: User behavior patterns via NetworkX
- Real-time Blocking: High-risk transactions stopped instantly
- Multi-modal Alerts: SMS/Email/Voice notifications

## Demo Data:

The system generates realistic mock transactions with different risk profiles:
- Normal: $5-500 at common merchants (Amazon, Starbucks)
- Suspicious: $500-2000 at higher-risk locations
- Fraudulent: $1000+ from unknown/foreign locations

## Stopping the System

```bash
# Stop all services
docker-compose down
pkill -f python
pkill -f node
```

## System Showcase:

- Modern ML Stack: TensorFlow, PyTorch, Transformers, Scikit-learn
- Cloud Integration: AWS Fraud Detector, Twilio communications
- Real-time Processing: Kafka streaming, Redis caching
- Professional Frontend: React with Recharts visualizations
- DevOps Ready: Docker Compose, health checks, logging
