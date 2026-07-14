import { useState, useEffect } from 'react';
import * as api from '../api';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchWatchlist(); }, []);

  async function fetchWatchlist() {
    try {
      const data = await api.getWatchlist();
      setWatchlist(data.watchlist || []);
    } catch {
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
    } catch {
      setError('Failed to remove stock');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Watchlist <span>·</span> <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}>{watchlist.length} stocks</span></h1>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <span className="live-dot" /> Live prices
        </span>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title">Add Symbol</span>
        </div>
        <div className="card-body">
          <form className="add-form" onSubmit={handleAdd}>
            <input
              type="text"
              placeholder="e.g. AAPL, MSFT, TCS.NS"
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              style={{ maxWidth: 280 }}
            />
            <button type="submit" disabled={adding} style={{ maxWidth: 120 }}>
              {adding ? 'Adding...' : '+ Add Stock'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Tracked Stocks</span>
        </div>
        {loading ? (
          <div className="loading">Loading market data...</div>
        ) : watchlist.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">📈</span>
            No stocks in your watchlist. Add a symbol above.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th className="right">Price</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map(w => (
                  <tr key={w.watchlist_id}>
                    <td><span className="sym">{w.symbol}</span></td>
                    <td className="right">
                      <span className="num-green">
                        {w.current_price != null ? `$${parseFloat(w.current_price).toFixed(2)}` : '—'}
                      </span>
                    </td>
                    <td className="right">
                      <button className="btn-danger" onClick={() => handleDelete(w.watchlist_id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
