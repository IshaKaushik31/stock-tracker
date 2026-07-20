import { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as api from './api';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Watchlist from './pages/Watchlist';
import Holdings from './pages/Holdings';
import Alerts from './pages/Alerts';
import Transcripts from './pages/Transcripts';

export const AuthContext = createContext(null);

export default function App() {
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, try to get a new access token using the refresh cookie
  useEffect(() => {
    api.refresh()
      .then(data => {
        api.setToken(data.token);
        setTokenState(data.token);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSetToken(t) {
    api.setToken(t);
    setTokenState(t);
  }

  function handleLogout() {
    api.logout();
    setTokenState(null);
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <AuthContext.Provider value={{ token, setToken: handleSetToken, logout: handleLogout }}>
      <BrowserRouter>
        {token && <Navbar />}
        <Routes>
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/watchlist" />} />
          <Route path="/register" element={!token ? <Register /> : <Navigate to="/watchlist" />} />
          <Route path="/watchlist" element={token ? <Watchlist /> : <Navigate to="/login" />} />
          <Route path="/holdings" element={token ? <Holdings /> : <Navigate to="/login" />} />
          <Route path="/alerts" element={token ? <Alerts /> : <Navigate to="/login" />} />
          <Route path="/transcripts" element={token ? <Transcripts /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={token ? '/watchlist' : '/login'} />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
