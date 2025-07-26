import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import axios from 'axios';

const RiskScores = () => {
  const [riskData, setRiskData] = useState([]);
  const [modelPerformance, setModelPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskData();
    
    const interval = setInterval(() => {
      fetchRiskData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchRiskData = async () => {
    try {
      // Generate mock risk analysis data
      const mockRiskData = generateMockRiskData();
      setRiskData(mockRiskData);
      
      const mockPerformance = generateModelPerformance();
      setModelPerformance(mockPerformance);
      
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockRiskData = () => {
    const data = [];
    for (let i = 0; i < 100; i++) {
      const amount = Math.random() * 5000 + 10;
      const baseRisk = Math.random();
      let riskScore = baseRisk;
      
      // Higher amounts tend to have higher risk
      if (amount > 1000) riskScore += 0.2;
      if (amount > 3000) riskScore += 0.3;
      
      riskScore = Math.min(riskScore, 1.0);
      
      data.push({
        id: `tx_${i}`,
        amount: Math.round(amount * 100) / 100,
        riskScore: Math.round(riskScore * 100) / 100,
        category: riskScore > 0.7 ? 'High Risk' : riskScore > 0.3 ? 'Medium Risk' : 'Low Risk'
      });
    }
    return data;
  };

  const generateModelPerformance = () => {
    return [
      {
        model: 'Random Forest',
        accuracy: 0.92,
        precision: 0.88,
        recall: 0.85,
        f1Score: 0.86
      },
      {
        model: 'LSTM Neural Network',
        accuracy: 0.89,
        precision: 0.91,
        recall: 0.82,
        f1Score: 0.86
      },
      {
        model: 'LLM Fine-tuned',
        accuracy: 0.87,
        precision: 0.89,
        recall: 0.84,
        f1Score: 0.86
      },
      {
        model: 'AWS Fraud Detector',
        accuracy: 0.85,
        precision: 0.83,
        recall: 0.88,
        f1Score: 0.85
      },
      {
        model: 'Ensemble Model',
        accuracy: 0.94,
        precision: 0.92,
        recall: 0.89,
        f1Score: 0.90
      }
    ];
  };

  const getRiskColor = (category) => {
    switch (category) {
      case 'High Risk': return '#EF4444';
      case 'Medium Risk': return '#F59E0B';
      case 'Low Risk': return '#10B981';
      default: return '#6B7280';
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
      {/* Risk Score Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          🎯 Risk Score vs Transaction Amount
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={riskData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="amount" 
              name="Amount"
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              dataKey="riskScore" 
              name="Risk Score"
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'amount' ? `$${value}` : `${(value * 100).toFixed(1)}%`,
                name === 'amount' ? 'Amount' : 'Risk Score'
              ]}
            />
            <Scatter 
              name="Transactions" 
              data={riskData.filter(d => d.category === 'Low Risk')}
              fill="#10B981"
            />
            <Scatter 
              name="Medium Risk" 
              data={riskData.filter(d => d.category === 'Medium Risk')}
              fill="#F59E0B"
            />
            <Scatter 
              name="High Risk" 
              data={riskData.filter(d => d.category === 'High Risk')}
              fill="#EF4444"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Model Performance Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          🔬 Model Performance Comparison
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={modelPerformance}>
            <PolarGrid />
            <PolarAngleAxis dataKey="model" />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Radar 
              name="Accuracy" 
              dataKey="accuracy" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.1}
            />
            <Radar 
              name="Precision" 
              dataKey="precision" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              fillOpacity={0.1}
            />
            <Radar 
              name="Recall" 
              dataKey="recall" 
              stroke="#ffc658" 
              fill="#ffc658" 
              fillOpacity={0.1}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
          <h4 className="text-md font-medium text-gray-900 mb-3">🟢 Low Risk Transactions</h4>
          <div className="text-3xl font-bold text-green-600">
            {riskData.filter(d => d.category === 'Low Risk').length}
          </div>
          <p className="text-sm text-gray-500">
            {((riskData.filter(d => d.category === 'Low Risk').length / riskData.length) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
          <h4 className="text-md font-medium text-gray-900 mb-3">🟡 Medium Risk Transactions</h4>
          <div className="text-3xl font-bold text-yellow-600">
            {riskData.filter(d => d.category === 'Medium Risk').length}
          </div>
          <p className="text-sm text-gray-500">
            {((riskData.filter(d => d.category === 'Medium Risk').length / riskData.length) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-
        <div className="bg-white p-6 rounded-lg shadow-lg card-shadow">
          <h4 className="text-md font-medium text-gray-900 mb-3">🔴 High Risk Transactions</h4>
          <div className="text-3xl font-bold text-red-600">
            {riskData.filter(d => d.category === 'High Risk').length}
          </div>
          <p className="text-sm text-gray-500">
            {((riskData.filter(d => d.category === 'High Risk').length / riskData.length) * 100).toFixed(1)}% of total
          </p>
        </div>
      </div>

      {/* Model Performance Table */}
      <div className="bg-white shadow-lg rounded-lg card-shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            📊 Detailed Model Metrics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precision
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recall
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  F1 Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modelPerformance.map((model) => (
                <tr key={model.model} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {model.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${model.accuracy * 100}%` }}
                        ></div>
                      </div>
                      {(model.accuracy * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(model.precision * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(model.recall * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(model.f1Score * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskScores;
