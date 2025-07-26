import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import axios from 'axios';

const Dashboard = ({ stats, systemStatus }) => {
  const [realtimeData, setRealtimeData] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [transactionVolume, setTransactionVolume] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Update every 10 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Generate mock real-time data for demo
      const now = new Date();
      const newData = [];
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        newData.push({
          time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          transactions: Math.floor(Math.random() * 50) + 10,
          blocked: Math.floor(Math.random() * 5),
          riskScore: Math.random() * 0.3 + 0.1
        });
      }
      
      setRealtimeData(newData);

      // Risk distribution data
      setRiskDistribution([
        { name: 'Low Risk', value: 70, color: '#10B981' },
        { name: 'Medium Risk', value: 25, color: '#F59E0B' },
        { name: 'High Risk', value: 5, color: '#EF4444' }
      ]);

      // Transaction volume by hour
      const volumeData = [];
      for (let hour = 0; hour < 24; hour++) {
        volumeData.push({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          volume: Math.floor(Math.random() * 200) + 50
        });
      }
      setTransactionVolume(volumeData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'blue' }) => (
    <div className={`bg-white overflow-hidden shadow-lg rounded-lg card-shadow`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`text-3xl`}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
                {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions.toLocaleString()}
          subtitle="Last 24 hours"
          icon="💳"
          color="blue"
        />
        <StatCard
          title="Blocked Transactions"
          value={stats.blockedTransactions}
          subtitle={`${((stats.blockedTransactions / Math.max(stats.totalTransactions, 1)) * 100).toFixed(1)}% of total`}
          icon="🛡️"
          color="red"
        />
        <StatCard
          title="Alerts Sent"
          value={stats.alertsSent}
          subtitle="Active monitoring"
          icon="🚨"
          color="yellow"
        />
        <StatCard
          title="Avg Risk Score"
          value={`${(stats.riskScore * 100).toFixed(1)}%`}
          subtitle="Real-time analysis"
          icon="🎯"
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Transaction Flow */}
        <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🔄 Real-time Transaction Flow
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="transactions" stroke="#3B82F6" strokeWidth={2} name="Transactions" />
              <Line type="monotone" dataKey="blocked" stroke="#EF4444" strokeWidth={2} name="Blocked" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🎯 Risk Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Volume Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📊 Transaction Volume by Hour
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={transactionVolume}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="volume" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* System Health Status */}
      <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          ⚙️ System Health Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(systemStatus).map(([service, status]) => (
            <div key={service} className="flex items-center p-3 border rounded-lg">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                status === 'healthy' ? 'bg-green-400 pulse' : 
                status === 'unhealthy' ? 'bg-red-400' : 'bg-yellow-400'
              }`}></div>
              <div>
                <div className="font-medium text-gray-900">
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </div>
                <div className={`text-sm ${
                  status === 'healthy' ? 'text-green-600' : 
                  status === 'unhealthy' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {status === 'healthy' ? 'Operational' : 
                   status === 'unhealthy' ? 'Down' : 'Unknown'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
