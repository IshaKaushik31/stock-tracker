import { useState, useEffect, useRef } from 'react';
import * as api from '../api';
import { currencySymbol } from '../api';

function formatVolume(v) {
  if (v == null) return '—';
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toString();
}

function formatMarketCap(v, sym) {
  if (v == null) return '—';
  const c = currencySymbol(sym);
  if (v >= 1e12) return c + (v / 1e12).toFixed(2) + 'T';
  if (v >= 1e9) return c + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return c + (v / 1e6).toFixed(2) + 'M';
  return c + v.toFixed(0);
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => { fetchWatchlist(); }, []);

  async function fetchWatchlist() {
    try {
      const data = await api.getWatchlist();
      setWatchlist(data.stocks || []);
    } catch {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }

  function handleSymbolChange(e) {
    const val = e.target.value;
    setSymbol(val);
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
    setSymbol(sym);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!symbol.trim()) return;
    setAdding(true);
    setError('');
    setShowSuggestions(false);
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

  async function handleDelete(symbol) {
    try {
      await api.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
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

      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'visible' }}>
        <div className="card-header">
          <span className="card-title">Add Symbol</span>
        </div>
        <div className="card-body">
          <form className="add-form" onSubmit={handleAdd}>
            <div style={{ position: 'relative', maxWidth: 280 }}>
              <input
                type="text"
                placeholder="Search symbol e.g. AAPL, TCS.NS"
                value={symbol}
                onChange={handleSymbolChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                style={{ width: '100%' }}
              />
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
                  <th className="right">Change</th>
                  <th className="right">52W High</th>
                  <th className="right">52W Low</th>
                  <th className="right">52W Chg</th>
                  <th className="right">Volume</th>
                  <th className="right">Market Cap</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map(w => {
                  const c = currencySymbol(w.symbol);
                  const chg = w.price_change != null ? parseFloat(w.price_change) : null;
                  const chgPct = w.price_change_pct != null ? parseFloat(w.price_change_pct) : null;
                  const pos = chg == null ? null : chg >= 0;
                  const w52Chg = w.week_52_change != null ? parseFloat(w.week_52_change) * 100 : null;
                  return (
                    <tr key={w.symbol}>
                      <td><span className="sym">{w.symbol}</span></td>
                      <td className="right">
                        <span className="num">{w.curr_price != null ? `${c}${parseFloat(w.curr_price).toFixed(2)}` : '—'}</span>
                      </td>
                      <td className="right">
                        <span className={pos == null ? 'num' : pos ? 'num-green' : 'num-red'}>
                          {chg == null ? '—' : `${pos ? '+' : ''}${c}${chg.toFixed(2)} (${pos ? '+' : ''}${chgPct.toFixed(2)}%)`}
                        </span>
                      </td>
                      <td className="right"><span className="num">{w.week_52_high != null ? `${c}${parseFloat(w.week_52_high).toFixed(2)}` : '—'}</span></td>
                      <td className="right"><span className="num">{w.week_52_low != null ? `${c}${parseFloat(w.week_52_low).toFixed(2)}` : '—'}</span></td>
                      <td className="right">
                        <span className={w52Chg == null ? 'num' : w52Chg >= 0 ? 'num-green' : 'num-red'}>
                          {w52Chg == null ? '—' : `${w52Chg >= 0 ? '+' : ''}${w52Chg.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="right"><span className="num">{formatVolume(w.volume)}</span></td>
                      <td className="right"><span className="num">{formatMarketCap(w.market_cap, w.symbol)}</span></td>
                      <td className="right">
                        <button className="btn-danger" onClick={() => handleDelete(w.symbol)}>Remove</button>
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
