import { useState, useEffect } from 'react';
import * as api from '../api';

export default function Holdings() {
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ symbol: '', quantity: '', buy_price: '', buy_date: '' });

  useEffect(() => {
    fetchHoldings();
  }, []);

  async function fetchHoldings() {
    try {
      const data = await api.getHoldings();
      setHoldings(data.holdings || []);
    } catch (err) {
      setError('Failed to load holdings');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    setError('');
    try {
      await api.addHolding(form.symbol.toUpperCase(), form.quantity, form.buy_price, form.buy_date);
      setForm({ symbol: '', quantity: '', buy_price: '', buy_date: '' });
      await fetchHoldings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add holding');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteHolding(id);
      setHoldings(prev => prev.filter(h => h.holding_id !== id));
    } catch (err) {
      setError('Failed to delete holding');
    }
  }

  function pnl(h) {
    if (h.current_price == null) return null;
    return (h.current_price - h.buy_price) * h.quantity;
  }

  function pnlPercent(h) {
    if (h.current_price == null) return null;
    return ((h.current_price - h.buy_price) / h.buy_price) * 100;
  }

  return (
    <div className="page">
      <h2>Holdings</h2>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>Add Holding</h3>
        <form className="inline-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Symbol"
            value={form.symbol}
            onChange={e => setForm({ ...form, symbol: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Buy Price"
            step="0.01"
            value={form.buy_price}
            onChange={e => setForm({ ...form, buy_price: e.target.value })}
            required
          />
          <input
            type="date"
            value={form.buy_date}
            onChange={e => setForm({ ...form, buy_date: e.target.value })}
            required
          />
          <button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add'}</button>
        </form>
      </div>

      <div className="card">
        <h3>Portfolio</h3>
        {loading ? (
          <div className="empty">Loading...</div>
        ) : holdings.length === 0 ? (
          <div className="empty">No holdings yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Buy Price</th>
                <th>Current Price</th>
                <th>P&amp;L</th>
                <th>P&amp;L %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => {
                const gain = pnl(h);
                const gainPct = pnlPercent(h);
                const cls = gain == null ? '' : gain >= 0 ? 'pnl-pos' : 'pnl-neg';
                return (
                  <tr key={h.holding_id}>
                    <td><span className="symbol">{h.symbol}</span></td>
                    <td>{h.quantity}</td>
                    <td>${parseFloat(h.buy_price).toFixed(2)}</td>
                    <td><span className="price">{h.current_price != null ? `$${parseFloat(h.current_price).toFixed(2)}` : '—'}</span></td>
                    <td><span className={cls}>{gain != null ? `${gain >= 0 ? '+' : ''}$${gain.toFixed(2)}` : '—'}</span></td>
                    <td><span className={cls}>{gainPct != null ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%` : '—'}</span></td>
                    <td><button className="btn-delete" onClick={() => handleDelete(h.holding_id)}>Delete</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
