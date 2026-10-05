import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.getStockDetail(symbol),
      api.getWatchlist()
    ])
      .then(([stockData, watchlistData]) => {
        setStock(stockData);
        const isTracked = (watchlistData.stocks || []).some(w => w.symbol === symbol);
        setAdded(isTracked);
      })
      .catch(() => setError('Failed to load stock data'))
      .finally(() => setLoading(false));
  }, [symbol]);

  async function handleAddToWatchlist() {
    setAdding(true);
    try {
      await api.addToWatchlist(symbol);
      setAdded(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to watchlist');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  if (error && !stock) return (
    <div className="page">
      <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>← Back</button>
      <div className="error">{error}</div>
    </div>
  );

  const c = currencySymbol(symbol);
  const chg = stock?.price_change != null ? parseFloat(stock.price_change) : null;
  const chgPct = stock?.price_change_pct != null ? parseFloat(stock.price_change_pct) : null;
  const pos = chg == null ? null : chg >= 0;
  const w52Chg = stock?.week_52_change != null ? parseFloat(stock.week_52_change) * 100 : null;

  return (
    <div className="page">
      <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>← Back</button>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ color: 'var(--neon-cyan)' }}>{symbol}</span>
            {stock?.name && (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400, marginLeft: '0.75rem' }}>
                {stock.name}
              </span>
            )}
          </h1>
        </div>
        {added ? (
          <span className="badge badge-green">✓ Added to Watchlist</span>
        ) : (
          <button onClick={handleAddToWatchlist} disabled={adding}>
            {adding ? 'Adding...' : '+ Add to Watchlist'}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-label">Price</div>
          <div className="stat-value">
            {stock?.curr_price != null ? `${c}${parseFloat(stock.curr_price).toFixed(2)}` : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Change</div>
          <div className={`stat-value ${pos == null ? '' : pos ? 'green' : 'red'}`}>
            {chg == null ? '—' : `${pos ? '+' : ''}${c}${chg.toFixed(2)} (${pos ? '+' : ''}${chgPct.toFixed(2)}%)`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">52W High</div>
          <div className="stat-value">
            {stock?.week_52_high != null ? `${c}${parseFloat(stock.week_52_high).toFixed(2)}` : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">52W Low</div>
          <div className="stat-value">
            {stock?.week_52_low != null ? `${c}${parseFloat(stock.week_52_low).toFixed(2)}` : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">52W Change</div>
          <div className={`stat-value ${w52Chg == null ? '' : w52Chg >= 0 ? 'green' : 'red'}`}>
            {w52Chg == null ? '—' : `${w52Chg >= 0 ? '+' : ''}${w52Chg.toFixed(2)}%`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Volume</div>
          <div className="stat-value">{formatVolume(stock?.volume)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Market Cap</div>
          <div className="stat-value">{formatMarketCap(stock?.market_cap, symbol)}</div>
        </div>
      </div>
    </div>
  );
}
