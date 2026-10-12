import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";

export default function Navbar() {
  // Temporary authentication until we connect the API
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        🏇 GRAND NATIONAL DISASTER
      </Link>

      <div className="navbar-links">
        {isLoggedIn && (
          <span className="navbar-balance">💰 £1,000</span>
        )}

        <Link to="/races" className="navbar-link">
          Races
        </Link>

        {isLoggedIn ? (
          <button onClick={handleLogout} className="navbar-button">
            Logout
          </button>
        ) : (
          <Link to="/login" className="navbar-button">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}