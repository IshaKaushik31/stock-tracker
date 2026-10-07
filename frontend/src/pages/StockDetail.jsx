import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createChart, AreaSeries } from 'lightweight-charts';
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

const RANGES = ['1W', '1M', '3M', '1Y'];

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [range, setRange] = useState('1M');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    setNews([]);
    setNewsLoading(true);

    Promise.all([api.getStockDetail(symbol), api.getWatchlist()])
      .then(([stockData, watchlistData]) => {
        setStock(stockData);
        const isTracked = (watchlistData.stocks || []).some(w => w.symbol === symbol);
        setAdded(isTracked);
      })
      .catch(() => setError('Failed to load stock data'))
      .finally(() => setLoading(false));

    api.getStockNews(symbol)
      .then(data => setNews(data.news || []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [symbol]);

  useEffect(() => {
    setHistoryLoading(true);
    api.getStockHistory(symbol, range)
      .then(data => setHistory(data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [symbol, range]);

  // Init chart once the loading screen is gone and container is in DOM
  useEffect(() => {
    if (loading || !chartContainerRef.current || chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      height: 280,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: false },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#22c55e',
      topColor: 'rgba(34,197,94,0.25)',
      bottomColor: 'rgba(34,197,94,0)',
      lineWidth: 2,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [loading]);

  // Feed data whenever history changes OR chart is newly created
  useEffect(() => {
    if (!seriesRef.current || history.length === 0) return;
    const chartData = history.map(d => ({ time: d.date, value: parseFloat(d.close) }));
    seriesRef.current.setData(chartData);
    chartRef.current.timeScale().fitContent();
  }, [history, loading]);

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
  const exchange = symbol.endsWith('.NS') ? 'NSE · INR' : 'NASDAQ · USD';

  const stats = [
    { label: 'Price', value: stock?.curr_price != null ? `${c}${parseFloat(stock.curr_price).toFixed(2)}` : '—' },
    { label: "Today's Change", value: chg == null ? '—' : `${pos ? '+' : ''}${c}${chg.toFixed(2)} (${pos ? '+' : ''}${chgPct.toFixed(2)}%)`, color: pos == null ? '' : pos ? 'var(--neon-green)' : '#ef4444' },
    { label: '52W High', value: stock?.week_52_high != null ? `${c}${parseFloat(stock.week_52_high).toFixed(2)}` : '—' },
    { label: '52W Low', value: stock?.week_52_low != null ? `${c}${parseFloat(stock.week_52_low).toFixed(2)}` : '—' },
    { label: '52W Change', value: w52Chg == null ? '—' : `${w52Chg >= 0 ? '+' : ''}${w52Chg.toFixed(2)}%`, color: w52Chg == null ? '' : w52Chg >= 0 ? 'var(--neon-green)' : '#ef4444' },
    { label: 'Volume', value: formatVolume(stock?.volume) },
    { label: 'Market Cap', value: formatMarketCap(stock?.market_cap, symbol) },
  ];

  return (
    <div className="page">
      <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1.25rem', fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>← Back</button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>{symbol}</h1>
            {stock?.company_name && (
              <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: 400 }}>{stock.company_name}</span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{exchange}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-bright)', lineHeight: 1 }}>
              {stock?.curr_price != null ? `${c}${parseFloat(stock.curr_price).toFixed(2)}` : '—'}
            </div>
            {chg != null && (
              <div style={{ fontSize: '0.9rem', color: pos ? 'var(--neon-green)' : '#ef4444', marginTop: '0.2rem' }}>
                {pos ? '+' : ''}{c}{chg.toFixed(2)} ({pos ? '+' : ''}{chgPct.toFixed(2)}%)
              </div>
            )}
          </div>
          {added ? (
            <span className="badge badge-green">✓ In Watchlist</span>
          ) : (
            <button onClick={handleAddToWatchlist} disabled={adding}>
              {adding ? 'Adding...' : '+ Watchlist'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Chart */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem' }}>
        {/* Range toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                background: range === r ? 'var(--neon-cyan)' : 'var(--bg-input)',
                color: range === r ? '#0a0f1a' : 'var(--text-dim)',
                transition: 'all 0.15s',
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div ref={chartContainerRef} style={{ width: '100%', opacity: historyLoading ? 0.4 : 1, transition: 'opacity 0.2s' }} />
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: s.color || 'var(--text-bright)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* News */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Latest News</span>
        </div>
        {newsLoading ? (
          <div className="loading">Loading news...</div>
        ) : news.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">📰</span>
            No recent news found.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0', padding: '0' }}>
            {news.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                  borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{article.source}</div>
                <div style={{ color: 'var(--text-bright)', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4 }}>{article.title}</div>
                {article.description && (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.description}
                  </div>
                )}
                <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: 'auto' }}>
                  {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
