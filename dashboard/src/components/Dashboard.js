import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import moment from 'moment';

const getDailyCounts = (items, dateKey = 'timestamp') => {
  const counts = {};
  items.forEach(item => {
    const day = moment(item[dateKey]).format('YYYY-MM-DD');
    counts[day] = (counts[day] || 0) + 1;
  });
  return Object.entries(counts).map(([date, count]) => ({ date, count }));
};

const getInsightText = (stats, transactions, alerts) => {
  if (!transactions.length) return 'Belum ada transaksi hari ini.';
  const today = moment().format('YYYY-MM-DD');
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  const dailyTx = getDailyCounts(transactions);
  const todayTx = dailyTx.find(d => d.date === today)?.count || 0;
  const yesterdayTx = dailyTx.find(d => d.date === yesterday)?.count || 0;
  if (todayTx > yesterdayTx) return `Lonjakan transaksi: +${todayTx - yesterdayTx} dibanding kemarin.`;
  if (stats.riskScore > 0.7) return 'Rata-rata risk score hari ini tinggi!';
  if (alerts.length > 0) return `Ada ${alerts.length} alert dikirim hari ini.`;
  return 'Sistem berjalan normal.';
};

const detectAnomaly = (transactions, alerts) => {
  // Simple anomaly: >2x rata-rata transaksi harian atau >5 alert dalam 1 jam
  const dailyTx = getDailyCounts(transactions);
  const avg = dailyTx.reduce((sum, d) => sum + d.count, 0) / (dailyTx.length || 1);
  const today = moment().format('YYYY-MM-DD');
  const todayTx = dailyTx.find(d => d.date === today)?.count || 0;
  if (todayTx > 2 * avg && todayTx > 10) return `Anomali: Transaksi hari ini (${todayTx}) jauh di atas rata-rata (${avg.toFixed(1)}).`;
  const recentAlerts = alerts.filter(a => moment(a.timestamp).isAfter(moment().subtract(1, 'hour')));
  if (recentAlerts.length > 5) return `Anomali: ${recentAlerts.length} alert dalam 1 jam terakhir!`;
  return null;
};

const Dashboard = ({ stats, transactions = [], alerts = [], riskScores = [] }) => {
  // Prepare chart data
  const txTrend = useMemo(() => getDailyCounts(transactions), [transactions]);
  const alertTrend = useMemo(() => getDailyCounts(alerts), [alerts]);
  const insight = useMemo(() => getInsightText(stats, transactions, alerts), [stats, transactions, alerts]);
  const anomaly = useMemo(() => detectAnomaly(transactions, alerts), [transactions, alerts]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
      {/* Insight Box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded shadow mb-4">
        <div className="font-semibold text-blue-800">Insight</div>
        <div className="text-blue-700">{insight}</div>
      </div>
      {/* Anomaly Highlight */}
      {anomaly && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow mb-4 animate-pulse">
          <div className="font-semibold text-red-800">Anomaly Detected</div>
          <div className="text-red-700">{anomaly}</div>
        </div>
      )}
      {/* Stats Grid */}
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
      {/* Trend Chart */}
      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <div className="font-semibold mb-2">Tren Transaksi & Alert (7 hari terakhir)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={txTrend.map((d, i) => ({
            date: d.date,
            transactions: d.count,
            alerts: alertTrend.find(a => a.date === d.date)?.count || 0
          }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="transactions" fill="#6366f1" name="Transaksi" />
            <Bar dataKey="alerts" fill="#f87171" name="Alert" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard; 