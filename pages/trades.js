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
      console.log("Fetched trades:", data);
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
      console.error("Error saving trade:", error);
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
      await fetchTrades();
    }
  };

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
        backgroundColor: ['#10B981', '#EF4444'],
      }
    ]
  };

  const getPnLClass = (trade) => {
    if (!trade.exit_price || !trade.entry_price) return '';
    const pnl = (trade.direction === 'buy'
      ? (trade.exit_price - trade.entry_price) * trade.lot_size
      : (trade.entry_price - trade.exit_price) * trade.lot_size);
    return pnl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getPnLValue = (trade) => {
    if (!trade.exit_price || !trade.entry_price) return '-';
    const pnl = (trade.direction === 'buy'
      ? (trade.exit_price - trade.entry_price) * trade.lot_size
      : (trade.entry_price - trade.exit_price) * trade.lot_size);
    return pnl.toFixed(2) + " $";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Forex Journal</h1>
        <p className="text-gray-600 dark:text-gray-300">Track your trades and performance</p>
      </header>

      {/* Trade Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Log a Trade</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency Pair</label>
              <select
                value={formData.pair}
                onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option>EUR/USD</option>
                <option>GBP/JPY</option>
                <option>BTC/USD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direction</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entry Price</label>
              <input
                type="number"
                step="0.0001"
                placeholder="Entry Price"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exit Price</label>
              <input
                type="number"
                step="0.0001"
                placeholder="Exit Price"
                value={formData.exitPrice}
                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lot Size</label>
              <input
                type="number"
                step="0.01"
                placeholder="Lot Size"
                value={formData.lotSize}
                onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows="3"
            />
          </div>

          {pnl !== null && (
            <div className={`p-3 rounded-md ${pnl >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-medium">Projected PnL: <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>{
                pnl.toFixed(2)} $
              </span></p>
            </div>
          )}

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Log Trade
          </button>
        </form>
      </div>

      {/* Dashboard Summary */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Trade Summary</h2>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading trades...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Trades</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{trades.length}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Win Rate</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{winRate.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total PnL</h3>
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`}
              </p>
            </div>
          </div>
        )}

        <div className="w-full md:w-1/2 mx-auto mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Win/Loss Ratio</h3>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <Pie data={chartData} />
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <h2 className="text-xl font-semibold p-6 text-gray-800 dark:text-white">Recent Trades</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pair</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Direction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Exit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-50