import { useState, useEffect, useRef } from 'react';
import * as api from '../api';
import { currencySymbol } from '../api';

export default function Holdings() {
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ symbol: '', quantity: '', buy_price: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => { fetchHoldings(); }, []);

  async function fetchHoldings() {
    try {
      const data = await api.getHoldings();
      setHoldings(data.holding || []);
    } catch {
      setError('Failed to load holdings');
    } finally {
      setLoading(false);
    }
  }

  function handleSymbolChange(e) {
    const val = e.target.value;
    setForm({ ...form, symbol: val });
    clearTimeout(debounceRef.current);
    if (val.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.searchSymbols(val.trim());
        setSuggestions(data.results || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 300);
  }

  function handleSuggestionClick(sym) {
    setForm({ ...form, symbol: sym });
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    setShowSuggestions(false);
    setError('');
    try {
      await api.addHolding(form.symbol.toUpperCase(), form.quantity, form.buy_price);
      setForm({ symbol: '', quantity: '', buy_price: '' });
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
    if (h.curr_price == null) return null;
    return (h.curr_price - h.price_bought) * h.quantity;
  }

  function computePnlPct(h) {
    if (h.curr_price == null) return null;
    return ((h.curr_price - h.price_bought) / h.price_bought) * 100;
  }

  const totalInvested = holdings.reduce((s, h) => s + h.price_bought * h.quantity, 0);
  const totalValue = holdings.reduce((s, h) => s + (h.curr_price ?? h.price_bought) * h.quantity, 0);
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
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Search symbol e.g. AAPL, TCS.NS" value={form.symbol}
                onChange={handleSymbolChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                style={{ width: '100%' }} required />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  borderRadius: 6, marginTop: 2, maxHeight: 200, overflowY: 'auto'
                }}>
                  {suggestions.map(s => (
                    <div key={s.symbol} onMouseDown={() => handleSuggestionClick(s.symbol)}
                      style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontWeight: 600 }}>{s.symbol}</span>
                      <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input type="number" placeholder="Quantity" value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })} required />
            <input type="number" placeholder="Buy Price" step="0.01" value={form.buy_price}
              onChange={e => setForm({ ...form, buy_price: e.target.value })} required />
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
                  <th className="right">Today</th>
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
                      <td className="right"><span className="num">{currencySymbol(h.symbol)}{parseFloat(h.price_bought).toFixed(2)}</span></td>
                      <td className="right">
                        <span className="num-green">
                          {h.curr_price != null ? `${currencySymbol(h.symbol)}${parseFloat(h.curr_price).toFixed(2)}` : '—'}
                        </span>
                      </td>
                      <td className="right">
                        {(() => {
                          const chg = h.price_change != null ? parseFloat(h.price_change) : null;
                          const chgPct = h.price_change_pct != null ? parseFloat(h.price_change_pct) : null;
                          const todayPos = chg == null ? null : chg >= 0;
                          return (
                            <span className={todayPos == null ? 'num' : todayPos ? 'num-green' : 'num-red'}>
                              {chg == null ? '—' : `${todayPos ? '+' : ''}${chgPct.toFixed(2)}%`}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="right">
                        <span className={pos == null ? 'num' : pos ? 'num-green' : 'num-red'}>
                          {pnl == null ? '—' : `${pos ? '+' : ''}${currencySymbol(h.symbol)}${pnl.toFixed(2)}`}
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
