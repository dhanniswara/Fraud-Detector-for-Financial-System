import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.neural_network import MLPClassifier
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import networkx as nx
import joblib
import json
from datetime import datetime, timedelta

class FraudDetectionModel:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.mlp_model = MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=500, random_state=42)
        self.lstm_model = None
        self.graph = nx.Graph()
        self.is_trained = False
        
    def create_lstm_model(self, input_shape):
        """Create LSTM model for sequence prediction"""
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25, activation='relu'),
            Dense(3, activation='softmax')  # 3 classes: normal, suspicious, fraudulent
        ])
        
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        return model
    
    def extract_features(self, transactions):
        """Extract features from transactions"""
        features = []
        
        for tx in transactions:
            feature_vector = [
                tx.get('amount', 0),
                hash(tx.get('merchant', '')) % 1000,
                hash(tx.get('location', '')) % 1000,
                hash(tx.get('device_info', '')) % 1000,
                self._get_hour_of_day(tx.get('timestamp', '')),
                self._get_day_of_week(tx.get('timestamp', '')),
                len(tx.get('ip_address', '')),
                tx.get('amount', 0) / 100.0,  # normalized amount
            ]
            features.append(feature_vector)
        
        return np.array(features)
    
    def _get_hour_of_day(self, timestamp_str):
        """Extract hour from timestamp"""
        try:
            dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            return dt.hour
        except:
            return 12
    
    def _get_day_of_week(self, timestamp_str):
        """Extract day of week from timestamp"""
        try:
            dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            return dt.weekday()
        except:
            return 0
    
    def build_transaction_graph(self, transactions):
        """Build graph of transaction relationships"""
        for tx in transactions:
            user_id = tx.get('user_id', '')
            merchant = tx.get('merchant', '')
            location = tx.get('location', '')
            
            # Add nodes and edges
            self.graph.add_node(user_id, type='user')
            self.graph.add_node(merchant, type='merchant')
            self.graph.add_node(location, type='location')
            
            # Add edges
            self.graph.add_edge(user_id, merchant, weight=tx.get('amount', 0))
            self.graph.add_edge(user_id, location, weight=1)
            self.graph.add_edge(merchant, location, weight=1)
    
    def get_graph_features(self, transaction):
        """Extract graph-based features"""
        user_id = transaction.get('user_id', '')
        merchant = transaction.get('merchant', '')
        
        features = {
            'user_degree': self.graph.degree(user_id) if user_id in self.graph else 0,
            'merchant_degree': self.graph.degree(merchant) if merchant in self.graph else 0,
            'user_centrality': nx.degree_centrality(self.graph).get(user_id, 0),
            'merchant_centrality': nx.degree_centrality(self.graph).get(merchant, 0),
        }
        
        return list(features.values())
    
    def train(self, transactions):
        """Train all models"""
        try:
            # Extract features
            X = self.extract_features(transactions)
            
            # Create labels (simulate based on risk profiles)
            y = []
            for tx in transactions:
                risk_profile = tx.get('risk_profile', 'normal')
                if risk_profile == 'normal':
                    y.append(0)
                elif risk_profile == 'suspicious':
                    y.append(1)
                else:  # fraudulent
                    y.append(2)
            
            y = np.array(y)
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train models
            self.rf_model.fit(X_scaled, y)
            self.isolation_forest.fit(X_scaled)
            self.mlp_model.fit(X_scaled, y)
            
            # Train LSTM model
            if len(X_scaled) > 10:
                # Reshape for LSTM (samples, time steps, features)
                X_lstm = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))
                y_categorical = tf.keras.utils.to_categorical(y, num_classes=3)
                
                self.lstm_model = self.create_lstm_model((1, X_scaled.shape[1]))
                self.lstm_model.fit(X_lstm, y_categorical, epochs=10, batch_size=32, verbose=0)
            
            # Build transaction graph
            self.build_transaction_graph(transactions)
            
            self.is_trained = True
            return True
            
        except Exception as e:
            print(f"Error training models: {e}")
            return False
    
    def predict(self, transaction):
        """Predict fraud risk for a transaction"""
        if not self.is_trained:
            return {'error': 'Model not trained'}
        
        try:
            # Extract features
            X = self.extract_features([transaction])
            X_scaled = self.scaler.transform(X)
            
            # Get predictions from all models
            rf_pred = self.rf_model.predict_proba(X_scaled)[0]
            isolation_pred = self.isolation_forest.predict(X_scaled)[0]
            mlp_pred = self.mlp_model.predict_proba(X_scaled)[0]
            
            # LSTM prediction
            lstm_pred = [0.33, 0.33, 0.34]  # default
            if self.lstm_model:
                X_lstm = X_scaled.reshape((1, 1, X_scaled.shape[1]))
                lstm_pred = self.lstm_model.predict(X_lstm, verbose=0)[0]
            
            # Graph features
            graph_features = self.get_graph_features(transaction)
            graph_risk = sum(graph_features) / len(graph_features) if graph_features else 0.5
            
            # Ensemble prediction
            ensemble_pred = (rf_pred + mlp_pred + lstm_pred) / 3
            
            # Adjust for isolation forest (anomaly detection)
            if isolation_pred == -1:  # anomaly detected
                ensemble_pred[2] = max(ensemble_pred[2], 0.7)  # boost fraudulent probability
            
            # Adjust for graph features
            if graph_risk > 0.7:
                ensemble_pred[2] = max(ensemble_pred[2], 0.6)
            
            # Normalize probabilities
            ensemble_pred = ensemble_pred / np.sum(ensemble_pred)
            
            return {
                'risk_scores': {
                    'normal': float(ensemble_pred[0]),
                    'suspicious': float(ensemble_pred[1]),
                    'fraudulent': float(ensemble_pred[2])
                },
                'prediction': ['normal', 'suspicious', 'fraudulent'][np.argmax(ensemble_pred)],
                'confidence': float(np.max(ensemble_pred)),
                'anomaly_detected': isolation_pred == -1,
                'graph_risk': graph_risk,
                'model_components': {
                    'random_forest': rf_pred.tolist(),
                    'mlp': mlp_pred.tolist(),
                    'lstm': lstm_pred.tolist(),
                    'isolation_forest': isolation_pred
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def save_model(self, filepath):
        """Save trained model"""
        try:
            joblib.dump({
                'scaler': self.scaler,
                'rf_model': self.rf_model,
                '
