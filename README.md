# FinShield Link - Complete Fraud Detection System

## Quick Start (One Command)

```bash
# Clone and run
git clone <your-repo-url>
cd finshield-link
./start.sh
```

Or on Windows:
```cmd
git clone <your-repo-url>
cd finshield-link
start.bat
```

## Architecture Overview

- **Ingestion Service**: Real-time card transaction capture
- **LLM Training**: Incremental fine-tuning on user behavior patterns
- **Risk Engine**: Hybrid ML (LSTM + Graph ML) + AWS Fraud Detector
- **Alert Service**: Real-time blocking and multi-channel notifications
- **Dashboard**: Unified web UI for monitoring and control

## File Structure

```
finshield-link/
├── README.md
├── docker-compose.yml
├── start.sh
├── start.bat
├── ingestion/
│   ├── ingest.py
│   └── requirements.txt
├── llm_training/
│   ├── train_llm.py
│   └── requirements.txt
├── risk_engine/
│   ├── model.py
│   ├── train_ml.py
│   ├── predict.py
│   └── requirements.txt
├── alert_service/
│   ├── notify.py
│   └── requirements.txt
└── dashboard/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── index.js
        └── components/
            ├── Dashboard.js
            ├── TransactionFeed.js
            ├── RiskScores.js
            ├── AlertPanel.js
            └── SystemControl.js
```

## Prerequisites

- Docker & Docker Compose
- Node.js & Yarn
- Python 3.8+
- AWS credentials (for Fraud Detector integration)

## Configuration

Set these environment variables or update the configs:

```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-west-2
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token
export SMTP_SERVER=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USERNAME=your_email
export SMTP_PASSWORD=your_password
```

## Features

✅ **Real-time Transaction Processing**  
✅ **Hybrid ML Risk Scoring**  
✅ **Live LLM Fine-tuning**  
✅ **Multi-channel Alerting**  
✅ **Interactive Web Dashboard**  
✅ **One-click Deployment**  

## API Endpoints

- Dashboard: `http://localhost:3000`
- Ingestion API: `http://localhost:8001`
- Risk Engine API: `http://localhost:8002`
- Alert Service API: `http://localhost:8003`

## Stopping the System

```bash
# Stop all services
docker-compose down
pkill -f python
pkill -f node
```
