import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Trades() {
  const [formData, setFormData] = useState({
    pair: 'EUR/USD',
    direction: 'buy',
    entryPrice: '',
    exitPrice: '',
    lotSize: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('trades')
      .insert([
        {
          pair: formData.pair,
          direction: formData.direction,
          entry_price: parseFloat(formData.entryPrice),
          exit_price: parseFloat(formData.exitPrice),
          lot_size: parseFloat(formData.lotSize),
          notes: formData.notes,
        }
      ]);

    if (error) {
      alert(`Error saving trade: ${error.message}`);
    } else {
      alert('Trade saved successfully!');
      setFormData({
        pair: 'EUR/USD',
        direction: 'buy',
        entryPrice: '',
        exitPrice: '',
        lotSize: '',
        notes: '',
      });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Log a Trade</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <select
          value={formData.pair}
          onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
          className="p-2 border rounded w-full"
        >
          <option>EUR/USD</option>
          <option>GBP/JPY</option>
          <option>BTC/USD</option>
        </select>
        <select
          value={formData.direction}
          onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
          className="p-2 border rounded w-full"
        >
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <input
          type="text"
          placeholder="Entry Price"
          value={formData.entryPrice}
          onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
          className="p-2 border rounded w-full"
        />
        <input
          type="text"
          placeholder="Exit Price"
          value={formData.exitPrice}
          onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
          className="p-2 border rounded w-full"
        />
        <input
          type="text"
          placeholder="Lot Size"
          value={formData.lotSize}
          onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
          className="p-2 border rounded w-full"
        />
        <textarea
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="p-2 border rounded w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
          Log Trade
        </button>
      </form>
    </div>
  );
}