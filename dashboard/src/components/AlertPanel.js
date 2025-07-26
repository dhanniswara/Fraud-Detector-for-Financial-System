import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const AlertPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [blockedTransactions, setBlockedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    fetchAlertData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchAlertData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchAlertData = async () => {
    try {
      const [alertsResponse, blockedResponse] = await Promise.all([
        axios.get('http://localhost:8003/alerts/recent?limit=50').catch(() => ({ data: [] })),
        axios.get('http://localhost:8003/blocked/recent?limit=50').catch(() => ({ data: [] }))
      ]);

      setAlerts(alertsResponse.data.length ? alertsResponse.data : generateMockAlerts());
      setBlockedTransactions(blockedResponse.data.length ? blockedResponse.data : generateMockBlocked());
      
    } catch (error) {
      console.error('Error fetching alert data:', error);
      setAlerts(generateMockAlerts());
      setBlockedTransactions(generateMockBlocked());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAlerts = () => {
    const alerts = [];
    const merchants = ['Suspicious Store', 'Unknown Merchant', 'High Risk Vendor', 'Cash Advance ATM'];
    const locations = ['Nigeria', 'Romania', 'Unknown Location', 'High Risk Area'];
    
    for (let i = 0; i < 20; i++) {
      alerts.push({
        _id: `alert_${Date.now()}_${i}`,
        transaction_id: `tx_${Date.now()}_${i}`,
        transaction: {
          amount: Math.round((Math.random() * 2000 + 100) * 100) / 100,
          merchant: merchants[Math.floor(Math.random() * merchants.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          user_id: `user_${Math.floor(Math.random() * 1000) + 1000}`,
          card_number: `****-****-****-${Math.floor(Math.random() * 9000) + 1000}`
        },
        prediction: {
          risk_level: ['HIGH', 'MEDIUM'][Math.floor(Math.random() * 2)],
          confidence: Math.random() * 0.3 + 0.7,
          should_block: Math.random() > 0.5
        },
        notifications_sent: {
          sms: true,
          email: true,
          voice: Math.random() > 0.7
        },
        created_at: new Date(Date.now() - Math.random() * 3600000).toISOString()
      });
    }
    
    return alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const generateMockBlocked = () => {
    const blocked = [];
    
    for (let i = 0; i < 10; i++) {
      blocked.push({
        _id: `blocked_${Date.now()}_${i}`,
        transaction_id: `tx_${Date.now()}_${i}`,
        blocked_at: new Date(Date.now() - Math.random() * 1800000).toISOString(),
        reason: 'Fraud detection',
        status: 'BLOCKED'
      });
    }
    
    return blocked.sort((a, b) => new Date(b.blocked_at) - new Date(a.blocked_at));
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelIcon = (level) => {
    switch (level) {
      case 'HIGH': return '🚨';
      case 'MEDIUM': return '⚠️';
      case 'LOW': return '✅';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-3xl">🚨</div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600">{alerts.length}</div>
              <div className="text-sm text-gray-500">Total Alerts</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-3xl">🛡️</div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600">{blockedTransactions.length}</div>
              <div className="text-sm text-gray-500">Blocked Transactions</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-3xl">📧</div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.notifications_sent?.email).length}
              </div>
              <div className="text-sm text-gray-500">Emails Sent</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-3xl">📱</div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-purple-600">
                {alerts.filter(a => a.notifications_sent?.sms).length}
              </div>
              <div className="text-sm text-gray-500">SMS Sent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-lg rounded-lg card-shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🚨 Active Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'blocked'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🛡️ Blocked Transactions ({blockedTransactions.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(alert.prediction?.risk_level)}`}>
                        {getRiskLevelIcon(alert.prediction?.risk_level)} {alert.prediction?.risk_level} RISK
                      </span>
                      <span className="text-sm text-gray-500">
                        {moment(alert.created_at).fromNow()}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {alert.notifications_sent?.email && <span className="text-green-600">📧</span>}
                      {alert.notifications_sent?.sms && <span className="text-blue-600">📱</span>}
                      {alert.notifications_sent?.voice && <span className="text-purple-600">📞</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Amount: </span>
                      <span className="text-gray-900">${alert.transaction?.amount}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Merchant: </span>
                      <span className="text-gray-900">{alert.transaction?.merchant}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Location: </span>
                      <span className="text-gray-900">{alert.transaction?.location}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Confidence: </span>
                      <span className="text-gray-900">{(alert.prediction?.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="font-medium text-gray-700">Card: </span>
                    <span className="text-gray-900">{alert.transaction?.card_number}</span>
                    <span className="ml-4 font-medium text-gray-700">User: </span>
                    <span className="text-gray-900">{alert.transaction?.user_id}</span>
                  </div>
                  
                  {alert.prediction?.should_block && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        🛡️ Transaction Blocked
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-4">
              {blockedTransactions.map((blocked) => (
                <div key={blocked._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        🛡️ BLOCKED
                      </span>
                      <span className="text-sm text-gray-600">
                        {moment(blocked.blocked_at).fromNow()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-red-700">
                      ID: {blocked.transaction_id}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Reason: </span>
                    <span className="text-gray-900">{blocked.reason}</span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="font-medium text-gray-700">Status: </span>
                    <span className="text-red-600 font-medium">{blocked.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;
