import { useState, useEffect } from 'react';
import * as api from '../api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ symbol: '', target_price: '', direction: 'above' });

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const data = await api.getAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
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
    } catch (err) {
      setError('Failed to delete alert');
    }
  }

  return (
    <div className="page">
      <h2>Alerts</h2>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>Create Alert</h3>
        <form className="inline-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Symbol (e.g. AAPL)"
            value={form.symbol}
            onChange={e => setForm({ ...form, symbol: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Target Price"
            step="0.01"
            value={form.target_price}
            onChange={e => setForm({ ...form, target_price: e.target.value })}
            required
          />
          <select
            value={form.direction}
            onChange={e => setForm({ ...form, direction: e.target.value })}
          >
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
          <button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add Alert'}</button>
        </form>
      </div>

      <div className="card">
        <h3>Active Alerts</h3>
        {loading ? (
          <div className="empty">Loading...</div>
        ) : alerts.length === 0 ? (
          <div className="empty">No alerts set.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Target Price</th>
                <th>Direction</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.alert_id}>
                  <td><span className="symbol">{a.symbol}</span></td>
                  <td>${parseFloat(a.target_price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${a.direction === 'above' ? 'badge-above' : 'badge-below'}`}>
                      {a.direction}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${a.triggered ? 'badge-triggered' : 'badge-active'}`}>
                      {a.triggered ? 'Triggered' : 'Active'}
                    </span>
                  </td>
                  <td><button className="btn-delete" onClick={() => handleDelete(a.alert_id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
