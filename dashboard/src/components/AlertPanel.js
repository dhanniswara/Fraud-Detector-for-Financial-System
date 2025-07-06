import React from 'react';

const AlertPanel = ({ alerts = [] }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Alerts</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Merchant</th>
              <th className="px-4 py-2">Risk</th>
              <th className="px-4 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-400">No alerts found.</td>
              </tr>
            ) : (
              alerts.map((alert, idx) => (
                <tr key={alert._id || idx} className="border-t">
                  <td className="px-4 py-2">{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : '--'}</td>
                  <td className="px-4 py-2">{alert.user_id || '--'}</td>
                  <td className="px-4 py-2">${alert.amount?.toFixed(2) ?? '--'}</td>
                  <td className="px-4 py-2">{alert.merchant || '--'}</td>
                  <td className="px-4 py-2 font-semibold">{alert.risk_level || '--'}</td>
                  <td className="px-4 py-2">{alert.type || 'Fraud Alert'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertPanel; 