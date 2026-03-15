import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert(`Error fetching trades: ${error.message}`);
    } else {
      setTrades(data || []);
    }
    setLoading(false);
  };

  // Calculate win rate and PnL
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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {loading ? (
        <p>Loading trades...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Total Trades</h2>
            <p className="text-2xl">{trades.length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Win Rate</h2>
            <p className="text-2xl">{winRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Total PnL</h2>
            <p className="text-2xl">{totalPnL.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="mt-8 w-full md:w-1/2 mx-auto">
        <h2 className="text-lg font-semibold mb-4">Win/Loss Ratio</h2>
        <Pie data={chartData} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
        <table className="min-w-full bg-white border">
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
                <td className="py-2 px-4 border">
                  {trade.exit_price && trade.entry_price ? (
                    (trade.direction === 'buy'
                      ? (trade.exit_price - trade.entry_price) * trade.lot_size
                      : (trade.entry_price - trade.exit_price) * trade.lot_size
                    ).toFixed(2)
                  ) : '-'}
                </td>
                <td className="py-2 px-4 border">{trade.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}