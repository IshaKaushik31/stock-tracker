import { useContext, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import * as api from '../api';

export default function Navbar() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  function handleSearchChange(e) {
    const val = e.target.value;
    setQuery(val);
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

  function handleSelect(symbol) {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/stock/${symbol}`);
  }

  return (
    <nav className="navbar">
      <span className="brand">StockTracker</span>
      <div className="nav-links">
        <NavLink to="/watchlist">Watchlist</NavLink>
        <NavLink to="/holdings">Holdings</NavLink>
        <NavLink to="/alerts">Alerts</NavLink>
        <NavLink to="/transcripts">AI Research</NavLink>
      </div>
      <div style={{ position: 'relative', margin: '0 1rem' }}>
        <input
          type="text"
          placeholder="Search symbol..."
          value={query}
          onChange={handleSearchChange}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          style={{ width: 200, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: 6, marginTop: 4, maxHeight: 240, overflowY: 'auto'
          }}>
            {suggestions.map(s => (
              <div key={s.symbol}
                onMouseDown={() => handleSelect(s.symbol)}
                style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontWeight: 600, color: 'var(--neon-cyan)' }}>{s.symbol}</span>
                <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="btn-logout" onClick={logout}>Sign Out</button>
    </nav>
  );
}
