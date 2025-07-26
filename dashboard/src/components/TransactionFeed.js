import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const TransactionFeed = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchTransactions();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:8001/transactions/recent?limit=100');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Generate mock data for demo
      const mockTransactions = generateMockTransactions();
      setTransactions(mockTransactions);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTransactions = () => {
    const transactions = [];
    const merchants = ['Amazon', 'Starbucks', 'Target', 'Walmart', 'Best Buy', 'McDonald\'s', 'Shell', 'CVS'];
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
    const riskProfiles = ['normal', 'suspicious', 'fraudulent'];
    
    for (let i = 0; i < 50; i++) {
      transactions.push({
        _id: `tx_${Date.now()}_${i}`,
        card_number: `****-****-****-${Math.floor(Math.random() * 9000) + 1000}`,
        amount: Math.round((Math.random() * 500 + 5) * 100) / 100,
        merchant: merchants[Math.floor(Math.random() * merchants.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        user_id: `user_${Math.floor(Math.random() * 1000) + 1000}`,
        ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        device_info: ['iPhone 14', 'Samsung Galaxy', 'Chrome Browser', 'Firefox Browser'][Math.floor(Math.random() * 4)],
        risk_profile: riskProfiles[Math.floor(Math.random() * riskProfiles.length)]
      });
    }
    
    return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getRiskBadge = (riskProfile) => {
    const badges = {
      normal: 'bg-green-100 text-green-800',
      suspicious: 'bg-yellow-100 text-yellow-800',
      fraudulent: 'bg-red-100 text-red-800'
    };
    
    return badges[riskProfile] || badges.normal;
  };

  const getRiskIcon = (riskProfile) => {
    const icons = {
      normal: '✅',
      suspicious: '⚠️',
      fraudulent: '🚨'
    };
    
    return icons[riskProfile] || icons.normal;
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
      <div className="bg-white shadow-lg rounded-lg card-shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            💳 Live Transaction Feed
          </h3>
          <p className="text-sm text-gray-500">Real-time transaction monitoring</p>
        </div>
        
        <div className="overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.card_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${transaction.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.merchant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadge(transaction.risk_profile)}`}>
                        <span className="mr-1">{getRiskIcon(transaction.risk_profile)}</span>
                        {transaction.risk_profile}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(transaction.timestamp).fromNow()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Transaction Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                  <p className="text-sm text-gray-900">{selectedTransaction._id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Number</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.card_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-sm text-gray-900">${selectedTransaction.amount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Merchant</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.merchant}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.user_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.ip_address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.device_info}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Profile</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadge(selectedTransaction.risk_profile)}`}>
                    {getRiskIcon(selectedTransaction.risk_profile)} {selectedTransaction.risk_profile}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">{moment(selectedTransaction.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFeed;
