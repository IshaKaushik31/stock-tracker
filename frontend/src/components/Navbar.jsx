import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Navbar() {
  const { logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <span className="brand">STOCKTRACKER</span>
      <div className="nav-links">
        <NavLink to="/watchlist">Watchlist</NavLink>
        <NavLink to="/holdings">Holdings</NavLink>
        <NavLink to="/alerts">Alerts</NavLink>
        <NavLink to="/transcripts">Transcripts</NavLink>
      </div>
      <button className="btn-logout" onClick={logout}>Logout</button>
    </nav>
  );
}
