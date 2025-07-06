import React from 'react';

const RiskScores = ({ riskScores = [] }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Risk Scores</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Transaction ID</th>
              <th className="px-4 py-2">Normal</th>
              <th className="px-4 py-2">Suspicious</th>
              <th className="px-4 py-2">Fraudulent</th>
              <th className="px-4 py-2">Prediction</th>
              <th className="px-4 py-2">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {riskScores.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-400">No risk scores found.</td>
              </tr>
            ) : (
              riskScores.map((score, idx) => (
                <tr key={score.transaction_id || idx} className="border-t">
                  <td className="px-4 py-2">{score.transaction_id || '--'}</td>
                  <td className="px-4 py-2">{(score.risk_scores?.normal * 100).toFixed(1) ?? '--'}%</td>
                  <td className="px-4 py-2">{(score.risk_scores?.suspicious * 100).toFixed(1) ?? '--'}%</td>
                  <td className="px-4 py-2">{(score.risk_scores?.fraudulent * 100).toFixed(1) ?? '--'}%</td>
                  <td className="px-4 py-2 font-semibold">{score.prediction || '--'}</td>
                  <td className="px-4 py-2">{(score.confidence * 100).toFixed(1) ?? '--'}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskScores; 