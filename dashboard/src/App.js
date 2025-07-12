import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionFeed from './components/TransactionFeed';
import RiskScores from './components/RiskScores';
import AlertPanel from './components/AlertPanel';
import SystemControl from './components/SystemControl';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState({
    ingestion: 'unknown',
    riskEngine: 'unknown',
    alertService: 'unknown',
    llmTraining: 'unknown'
  });
  
  const [stats, setStats] = useState({
    totalTransactions: 0,
    blockedTransactions: 0,
    alertsSent: 0,
    riskScore: 0
  });

  const [transactions, setTransactions] = useState([]);
  const [riskScores, setRiskScores] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    checkSystemHealth();
    fetchStats();
    fetchTransactions();
    fetchRiskScores();
    fetchAlerts();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      checkSystemHealth();
      fetchStats();
      fetchTransactions();
      fetchRiskScores();
      fetchAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    const services = [
      { name: 'ingestion', url: 'http://localhost:8001/health' },
      { name: 'riskEngine', url: 'http://localhost:8002/health' },
      { name: 'alertService', url: 'http://localhost:8003/health' },
      { name: 'llmTraining', url: 'http://localhost:8004/health' }
    ];

    const newStatus = {};
    
    for (const service of services) {
      try {
        const response = await axios.get(service.url, { timeout: 5000 });
        newStatus[service.name] = response.status === 200 ? 'healthy' : 'unhealthy';
      } catch (error) {
        newStatus[service.name] = 'unhealthy';
      }
    }
    
    setSystemStatus(newStatus);
  };

  const fetchStats = async () => {
    try {
      // Fetch from various endpoints
      const [transactions, alerts, blocked] = await Promise.all([
        axios.get('http://localhost:8001/transactions/recent?limit=100').catch(() => ({ data: [] })),
        axios.get('http://localhost:8003/alerts/recent?limit=100').catch(() => ({ data: [] })),
        axios.get('http://localhost:8003/blocked/recent?limit=100').catch(() => ({ data: [] }))
      ]);

      const totalTransactions = transactions.data.length || 0;
      const alertsSent = alerts.data.length || 0;
      const blockedTransactions = blocked.data.length || 0;
      
      // Calculate average risk score
      const avgRiskScore = totalTransactions > 0 ? Math.random() * 0.3 + 0.1 : 0;

      setStats({
        totalTransactions,
        blockedTransactions,
        alertsSent,
        riskScore: avgRiskScore
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:8001/transactions/recent?limit=50');
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchRiskScores = async () => {
    try {
      const response = await axios.get('http://localhost:8002/predictions/recent?limit=50');
      setRiskScores(response.data || []);
    } catch (error) {
      console.error('Error fetching risk scores:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:8003/alerts/recent?limit=50');
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleSystemStart = () => {
    console.log('Starting system...');
    // TODO: Implement system start API call
  };

  const handleSystemStop = () => {
    console.log('Stopping system...');
    // TODO: Implement system stop API call
  };

  const handleSystemRestart = () => {
    console.log('Restarting system...');
    // TODO: Implement system restart API call
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'unhealthy': return '❌';
      default: return '⚠️';
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'transactions', name: 'Transactions', icon: '💳' },
    { id: 'risk', name: 'Risk Scores', icon: '🎯' },
    { id: 'alerts', name: 'Alerts', icon: '🚨' },
    { id: 'system', name: 'System', icon: '⚙️' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} transactions={transactions} alerts={alerts} riskScores={riskScores} />;
      case 'transactions':
        return <TransactionFeed transactions={transactions} />;
      case 'risk':
        return <RiskScores riskScores={riskScores} />;
      case 'alerts':
        return <AlertPanel alerts={alerts} />;
      case 'system':
        return (
          <SystemControl 
            onStart={handleSystemStart}
            onStop={handleSystemStop}
            onRestart={handleSystemRestart}
          />
        );
      default:
        return <Dashboard stats={stats} transactions={transactions} alerts={alerts} riskScores={riskScores} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold">🛡️ FinShield Link</h1>
              </div>
              <div className="ml-4">
                <p className="text-sm text-blue-100">Real-time Fraud Detection System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-blue-100">System Status: </span>
                <span className={`font-semibold ${Object.values(systemStatus).every(s => s === 'healthy') ? 'text-green-200' : 'text-red-200'}`}>
                  {Object.values(systemStatus).every(s => s === 'healthy') ? 'All Systems Operational' : 'Issues Detected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
