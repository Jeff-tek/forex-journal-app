import { useState } from 'react';

export default function Trades() {
  const [formData, setFormData] = useState({
    pair: 'EUR/USD',
    direction: 'buy',
    entryPrice: '',
    exitPrice: '',
    lotSize: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Trade logged! (Connect to Supabase in a real app)');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Log a Trade</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <select
          value={formData.pair}
          onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
          className="p-2 border rounded"
        >
          <option>EUR/USD</option>
          <option>GBP/JPY</option>
          <option>BTC/USD</option>
        </select>
        <input
          type="text"
          placeholder="Entry Price"
          value={formData.entryPrice}
          onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
          className="p-2 border rounded w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Log Trade
        </button>
      </form>
    </div>
  );
}