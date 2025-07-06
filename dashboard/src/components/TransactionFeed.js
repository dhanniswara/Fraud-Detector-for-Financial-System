import React from 'react';

const TransactionFeed = ({ transactions = [] }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Merchant</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-400">No transactions found.</td>
              </tr>
            ) : (
              transactions.map((tx, idx) => (
                <tr key={tx._id || idx} className="border-t">
                  <td className="px-4 py-2">{tx.user_id || '--'}</td>
                  <td className="px-4 py-2">${tx.amount?.toFixed(2) ?? '--'}</td>
                  <td className="px-4 py-2">{tx.merchant || '--'}</td>
                  <td className="px-4 py-2">{tx.location || '--'}</td>
                  <td className="px-4 py-2">{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '--'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${tx.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {tx.status || 'normal'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionFeed; 