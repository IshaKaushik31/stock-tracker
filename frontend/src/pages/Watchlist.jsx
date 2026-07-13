import { useState, useEffect } from 'react';
import * as api from '../api';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  async function fetchWatchlist() {
    try {
      const data = await api.getWatchlist();
      setWatchlist(data.watchlist || []);
    } catch (err) {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!symbol.trim()) return;
    setAdding(true);
    setError('');
    try {
      await api.addToWatchlist(symbol.toUpperCase());
      setSymbol('');
      await fetchWatchlist();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.removeFromWatchlist(id);
      setWatchlist(prev => prev.filter(w => w.watchlist_id !== id));
    } catch (err) {
      setError('Failed to remove stock');
    }
  }

  return (
    <div className="page">
      <h2>Watchlist</h2>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>Add Stock</h3>
        <form className="inline-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Symbol (e.g. AAPL, TCS.NS)"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
          />
          <button type="submit" disabled={adding}>
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Your Stocks</h3>
        {loading ? (
          <div className="empty">Loading...</div>
        ) : watchlist.length === 0 ? (
          <div className="empty">No stocks in your watchlist yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Current Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map(w => (
                <tr key={w.watchlist_id}>
                  <td><span className="symbol">{w.symbol}</span></td>
                  <td><span className="price">{w.current_price != null ? `$${parseFloat(w.current_price).toFixed(2)}` : '—'}</span></td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(w.watchlist_id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
