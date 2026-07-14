import { useState, useEffect } from 'react';
import * as api from '../api';

export default function Holdings() {
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ symbol: '', quantity: '', buy_price: '', buy_date: '' });

  useEffect(() => { fetchHoldings(); }, []);

  async function fetchHoldings() {
    try {
      const data = await api.getHoldings();
      setHoldings(data.holdings || []);
    } catch {
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
    } catch {
      setError('Failed to delete holding');
    }
  }

  function computePnl(h) {
    if (h.current_price == null) return null;
    return (h.current_price - h.buy_price) * h.quantity;
  }

  function computePnlPct(h) {
    if (h.current_price == null) return null;
    return ((h.current_price - h.buy_price) / h.buy_price) * 100;
  }

  const totalInvested = holdings.reduce((s, h) => s + h.buy_price * h.quantity, 0);
  const totalValue = holdings.reduce((s, h) => s + (h.current_price ?? h.buy_price) * h.quantity, 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Portfolio</h1>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-label">Total Invested</div>
          <div className="stat-value cyan">${totalInvested.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Current Value</div>
          <div className="stat-value">${totalValue.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total P&amp;L</div>
          <div className={`stat-value ${totalPnl >= 0 ? 'green' : 'red'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Return</div>
          <div className={`stat-value ${totalPnlPct >= 0 ? 'green' : 'red'}`}>
            {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Add Position</span>
        </div>
        <div className="card-body">
          <form className="add-form" onSubmit={handleAdd}>
            <input type="text" placeholder="Symbol" value={form.symbol}
              onChange={e => setForm({ ...form, symbol: e.target.value })} required />
            <input type="number" placeholder="Quantity" value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })} required />
            <input type="number" placeholder="Buy Price" step="0.01" value={form.buy_price}
              onChange={e => setForm({ ...form, buy_price: e.target.value })} required />
            <input type="date" value={form.buy_date}
              onChange={e => setForm({ ...form, buy_date: e.target.value })} required />
            <button type="submit" disabled={adding}>{adding ? 'Adding...' : '+ Add'}</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Holdings</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{holdings.length} positions</span>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : holdings.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">💼</span>
            No positions yet. Add your first trade above.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th className="right">Qty</th>
                  <th className="right">Buy Price</th>
                  <th className="right">Current</th>
                  <th className="right">P&amp;L</th>
                  <th className="right">Return</th>
                  <th className="right"></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => {
                  const pnl = computePnl(h);
                  const pct = computePnlPct(h);
                  const pos = pnl == null ? null : pnl >= 0;
                  return (
                    <tr key={h.holding_id}>
                      <td><span className="sym">{h.symbol}</span></td>
                      <td className="right"><span className="num">{h.quantity}</span></td>
                      <td className="right"><span className="num">${parseFloat(h.buy_price).toFixed(2)}</span></td>
                      <td className="right">
                        <span className="num-green">
                          {h.current_price != null ? `$${parseFloat(h.current_price).toFixed(2)}` : '—'}
                        </span>
                      </td>
                      <td className="right">
                        <span className={pos == null ? 'num' : pos ? 'num-green' : 'num-red'}>
                          {pnl == null ? '—' : `${pos ? '+' : ''}$${pnl.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="right">
                        <span className={pos == null ? 'num' : pos ? 'num-green' : 'num-red'}>
                          {pct == null ? '—' : `${pos ? '+' : ''}${pct.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="right">
                        <button className="btn-danger" onClick={() => handleDelete(h.holding_id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
