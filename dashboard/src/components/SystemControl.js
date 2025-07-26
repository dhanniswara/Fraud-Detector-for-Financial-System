import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SystemControl = ({ systemStatus }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if system is running based on service status
    const allHealthy = Object.values(systemStatus).every(status => status === 'healthy');
    setIsRunning(allHealthy);
    
    // Generate mock system logs
    generateSystemLogs();
  }, [systemStatus]);

  const generateSystemLogs = () => {
    const logs = [];
    const logTypes = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];
    const services = ['Ingestion', 'Risk Engine', 'Alert Service', 'LLM Training'];
    const messages = [
      'Service started successfully',
      'Processing transaction batch',
      'Model training completed',
      'Alert sent to administrators',
      'Database connection established',
      'Kafka consumer connected',
      'Redis cache updated',
      'Health check passed'
    ];

    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 3600000);
      logs.push({
        id: i,
        timestamp: timestamp.toISOString(),
        type: logTypes[Math.floor(Math.random() * logTypes.length)],
        service: services[Math.floor(Math.random() * services.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
      });
    }

    setSystemLogs(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  const handleStartStop = async () => {
    setLoading(true);
    
    try {
      // Simulate start/stop operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isRunning) {
        // Simulate stopping the system
        addLogEntry('INFO', 'System', 'Stopping all services...');
        setIsRunning(false);
      } else {
        // Simulate starting the system
        addLogEntry('INFO', 'System', 'Starting all services...');
        setIsRunning(true);
      }
      
    } catch (error) {
      addLogEntry('ERROR', 'System', `Failed to ${isRunning ? 'stop' : 'start'} system: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addLogEntry = (type, service, message) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type,
      service,
      message
    };
    
    setSystemLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'SUCCESS': return 'text-green-600 bg-green-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50';
      case 'ERROR': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLogTypeIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return '✅';
      case 'INFO': return 'ℹ️';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      default: return '📝';
    }
  };

  const getServiceHealthIcon = (service, status) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'unhealthy': return '🔴';
      default: return '🟡';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Control Panel */}
      <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          ⚙️ System Control Panel
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">System Status</h4>
            <div className="space-y-3">
              {Object.entries(systemStatus).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">{getServiceHealthIcon(service, status)}</span>
                    <span className="font-medium text-gray-900">
                      {service.charAt(0).toUpperCase() + service.slice(1).replace(/([A-Z])/g, ' $1')}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'healthy' ? 'bg-green-100 text-green-800' :
                    status === 'unhealthy' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {status === 'healthy' ? 'Running' : status === 'unhealthy' ? 'Stopped' : 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Control Actions */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Control Actions</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Pipeline Status</div>
                  <div className={`text-sm ${isRunning ? 'text-green-600' : 'text-red-600'}`}>
                    {isRunning ? '🟢 Running' : '🔴 Stopped'}
                  </div>
                </div>
                <button
                  onClick={handleStartStop}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isRunning
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isRunning ? 'Stopping...' : 'Starting...'}
                    </span>
                  ) : (
                    isRunning ? 'Stop System' : 'Start System'
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => addLogEntry('INFO', 'System', 'Manual health check initiated')}
                >
                  🔍 Health Check
                </button>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  onClick={() => addLogEntry('INFO', 'System', 'System restart initiated')}
                >
                  🔄 Restart Services
                </button>
                <button
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  onClick={() => addLogEntry('WARNING', 'System', 'Manual backup initiated')}
                >
                  💾 Backup Data
                </button>
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  onClick={() => setSystemLogs([])}
                >
                  🗑️ Clear Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white shadow-lg rounded-lg card-shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            📋 System Logs
          </h3>
          <p className="text-sm text-gray-500">Real-time system activity and events</p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-1 p-4">
            {systemLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                <span className="text-sm">{getLogTypeIcon(log.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLogTypeColor(log.type)}`}>
                      {log.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      [{log.service}]
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          🔧 Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Service Endpoints</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ingestion API:</span>
                <span className="font-mono text-blue-600">localhost:8001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Engine:</span>
                <span className="font-mono text-blue-600">localhost:8002</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alert Service:</span>
                <span className="font-mono text-blue-600">localhost:8003</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">LLM Training:</span>
                <span className="font-mono text-blue-600">localhost:8004</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Infrastructure</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Kafka:</span>
                <span className="font-mono text-green-600">localhost:9092</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">MongoDB:</span>
                <span className="font-mono text-green-600">localhost:27017</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Redis:</span>
                <span className="font-mono text-green-600">localhost:6379</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dashboard:</span>
                <span className="font-mono text-green-600">localhost:3000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemControl;
