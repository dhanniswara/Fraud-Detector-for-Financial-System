import React from 'react';

const SystemControl = ({ onRestart, onStop, onStart }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">System Control</h2>
      <div className="flex space-x-4">
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow"
          onClick={onStart}
        >
          Start System
        </button>
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded shadow"
          onClick={onRestart}
        >
          Restart System
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow"
          onClick={onStop}
        >
          Stop System
        </button>
      </div>
      <div className="mt-6 text-gray-500 text-sm">
        <p>Note: These controls are placeholders. Integrate with backend API for real actions.</p>
      </div>
    </div>
  );
};

export default SystemControl; 