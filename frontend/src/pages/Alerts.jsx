import { useState, useEffect } from 'react';
import * as api from '../api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ symbol: '', target_price: '', direction: 'above' });

  useEffect(() => { fetchAlerts(); }, []);

  async function fetchAlerts() {
    try {
      const data = await api.getAlerts();
      setAlerts(data.alerts || []);
    } catch {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    setError('');
    try {
      await api.addAlert(form.symbol.toUpperCase(), form.target_price, form.direction);
      setForm({ symbol: '', target_price: '', direction: 'above' });
      await fetchAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add alert');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.alert_id !== id));
    } catch {
      setError('Failed to delete alert');
    }
  }

  const active = alerts.filter(a => !a.triggered).length;
  const triggered = alerts.filter(a => a.triggered).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Price Alerts</h1>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-label">Active Alerts</div>
          <div className="stat-value cyan">{active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Triggered</div>
          <div className="stat-value red">{triggered}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{alerts.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">New Alert</span>
        </div>
        <div className="card-body">
          <form className="add-form" onSubmit={handleAdd}>
            <input type="text" placeholder="Symbol (e.g. AAPL)"
              value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} required />
            <input type="number" placeholder="Target Price" step="0.01"
              value={form.target_price} onChange={e => setForm({ ...form, target_price: e.target.value })} required />
            <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}
              style={{ maxWidth: 140 }}>
              <option value="above">Price goes above</option>
              <option value="below">Price goes below</option>
            </select>
            <button type="submit" disabled={adding}>{adding ? 'Adding...' : '+ Set Alert'}</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Your Alerts</span>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : alerts.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">🔔</span>
            No alerts set. Create one above to get notified by email.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th className="right">Target Price</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th className="right"></th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.alert_id}>
                    <td><span className="sym">{a.symbol}</span></td>
                    <td className="right"><span className="num">${parseFloat(a.target_price).toFixed(2)}</span></td>
                    <td>
                      <span className={`badge ${a.direction === 'above' ? 'badge-green' : 'badge-red'}`}>
                        {a.direction === 'above' ? '▲ Above' : '▼ Below'}
                      </span>
                    </td>
                    <td>
                      {a.triggered
                        ? <span className="badge badge-red">⚡ Triggered</span>
                        : <span className="badge badge-dim">● Active</span>}
                    </td>
                    <td className="right">
                      <button className="btn-danger" onClick={() => handleDelete(a.alert_id)}>Delete</button>
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
