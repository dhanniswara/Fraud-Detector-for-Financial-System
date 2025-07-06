import React from 'react';

const Dashboard = ({ stats }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-gray-500">Total Transactions</span>
          <span className="text-3xl font-bold">{stats?.totalTransactions ?? '--'}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-gray-500">Blocked Transactions</span>
          <span className="text-3xl font-bold">{stats?.blockedTransactions ?? '--'}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-gray-500">Alerts Sent</span>
          <span className="text-3xl font-bold">{stats?.alertsSent ?? '--'}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-gray-500">Avg. Risk Score</span>
          <span className="text-3xl font-bold">{stats?.riskScore?.toFixed(2) ?? '--'}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 