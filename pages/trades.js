import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Trades() {
  const [formData, setFormData] = useState({
    pair: 'EUR/USD',
    direction: 'buy',
    entryPrice: '',
    exitPrice: '',
    lotSize: '',
    notes: '',
  });
  
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pnl, setPnl] = useState(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    // Calculate PnL in real-time
    if (formData.entryPrice && formData.exitPrice && formData.lotSize) {
      const entry = parseFloat(formData.entryPrice);
      const exit = parseFloat(formData.exitPrice);
      const lot = parseFloat(formData.lotSize);
      
      if (!isNaN(entry) && !isNaN(exit) && !isNaN(lot)) {
        const calculatedPnl = (formData.direction === 'buy'
          ? (exit - entry) * lot
          : (entry - exit) * lot
        );
        setPnl(calculatedPnl);
      }
    }
  }, [formData.entryPrice, formData.exitPrice, formData.lotSize, formData.direction]);

  const fetchTrades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching trades:`, error);
      alert(`Error fetching trades: ${error.message}`);
    } else {
      setTrades(data || []);
    }
    setLoading(false);
  };

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
      setPnl(null);
      fetchTrades(); // Refresh the trades list
    }
  };

  // Calculate win rate and total PnL
  const { winRate, totalPnL } = calculateStats(trades);

  function calculateStats(trades) {
    let wins = 0;
    let totalPnL = 0;
    let totalTrades = trades.length;

    trades.forEach(trade => {
      if (trade.exit_price && trade.entry_price) {
        const pnl = (trade.direction === 'buy'
          ? (trade.exit_price - trade.entry_price) * trade.lot_size
          : (trade.entry_price - trade.exit_price) * trade.lot_size);
        totalPnL += pnl;
        if (pnl > 0) wins++;
      }
    });

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    return { winRate, totalPnL };
  }

  // Data for the win/loss chart
  const chartData = {
    labels: ['Wins', 'Losses'],
    datasets: [
      {
        data: [
          trades.filter(t => {
            if (!t.exit_price) return false;
            const pnl = (t.direction === 'buy'
              ? (t.exit_price - t.entry_price) * t.lot_size
              : (t.entry_price - t.exit_price) * t.lot_size);
            return pnl > 0;
          }).length,
          trades.filter(t => {
            if (!t.exit_price) return false;
            const pnl = (t.direction === 'buy'
              ? (t.exit_price - t.entry_price) * t.lot_size
              : (t.entry_price - t.exit_price) * t.lot_size);
            return pnl <= 0;
          }).length
        ],
        backgroundColor: ['#4CAF50', '#F44336'],
      }
    ]
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Forex Journal</h1>

      {/* Trade Form */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Log a Trade</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              step="0.0001"
              placeholder="Entry Price"
              value={formData.entryPrice}
              onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
              className="p-2 border rounded w-full"
            />
            
            <input
              type="number"
              step="0.0001"
              placeholder="Exit Price"
              value={formData.exitPrice}
              onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
              className="p-2 border rounded w-full"
            />
            
            <input
              type="number"
              step="0.01"
              placeholder="Lot Size"
              value={formData.lotSize}
              onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
              className="p-2 border rounded w-full"
            />
          </div>

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="p-2 border rounded w-full"
          />

          {pnl !== null && (
            <div className={`p-2 rounded ${pnl >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              PnL: {pnl.toFixed(2)} $
            </div>
          )}

          <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
            Log Trade
          </button>
        </form>
      </div>

      {/* Dashboard Summary */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Trade Summary</h2>
        
        {loading ? (
          <p>Loading trades...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-semibold">Total Trades</h3>
              <p className="text-2xl">{trades.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-semibold">Win Rate</h3>
              <p className="text-2xl">{winRate.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-semibold">Total PnL</h3>
              <p className="text-2xl">{totalPnL.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="w-full md:w-1/2 mx-auto mb-6">
          <h3 className="text-lg font-semibold mb-2">Win/Loss Ratio</h3>
          <Pie data={chartData} />
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
        
        {loading ? (
          <p>Loading trades...</p>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Pair</th>
                <th className="py-2 px-4 border">Direction</th>
                <th className="py-2 px-4 border">Entry Price</th>
                <th className="py-2 px-4 border">Exit Price</th>
                <th className="py-2 px-4 border">PnL</th>
                <th className="py-2 px-4 border">Notes</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <tr key={trade.id}>
                  <td className="py-2 px-4 border">{trade.pair}</td>
                  <td className="py-2 px-4 border">{trade.direction}</td>
                  <td className="py-2 px-4 border">{trade.entry_price}</td>
                  <td className="py-2 px-4 border">{trade.exit_price || '-'}</td>
                  <td className={`py-2 px-4 border ${
                      trade.exit_price && trade.entry_price ? (
                        (trade.direction === 'buy'
                          ? (trade.exit_price - trade.entry_price) * trade.lot_size
                          : (trade.entry_price - trade.exit_price) * trade.lot_size
                        ) > 0 ? 'text-green-600' : 'text-red-600'
                      ) : ''}`}>
                    {trade.exit_price && trade.entry_price ? (
                      (trade.direction === 'buy'
                        ? (trade.exit_price - trade.entry_price) * trade.lot_size
                        : (trade.entry_price - trade.exit_price) * trade.lot_size
                      ).toFixed(2) + " $"
                    ) : '-'}
                  </td>
                  <td className="py-2 px-4 border">{trade.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}