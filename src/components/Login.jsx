import React, { useState } from 'react';
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import logo from '../images/logonav.png';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!username.trim() || !password.trim()) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: username,
          contrasenia: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Usuario o contraseña incorrectos.');
        return;
      }

      onLogin(data);
    } catch (err) {
      console.error('Error al conectar con el servidor:', err);
      setError('No se pudo conectar con el servidor. Verifica que esté encendido.');
    }
  };

  return (
    <div className="login-page-container">
      {/* Left visual branding pane - Desktop only */}
      <div className="login-left-pane">
        <div className="login-brand-wrapper text-center w-100 d-flex flex-column align-items-center">
          <img src={logo} alt="Solcito Logo" className="login-logo-img mb-3" />
          <div className="d-flex flex-column align-items-center">
            <span className="sidebar-brand-text login-cursive-brand">Solcito</span>
            <span className="sidebar-subbrand-text login-subbrand">BLANQUERIA</span>
          </div>
          <p className="login-brand-tagline">
            Calidad, confort y elegancia para tu hogar.
          </p>
        </div>
      </div>

      {/* Right form pane */}
      <div className="login-right-pane">
        <div style={{ height: '1px' }}></div>

        <div className="login-card">
          <div className="login-card-header text-center">
            {/* Display logo inside card on mobile */}
            <div className="d-lg-none mb-4">
              <img src={logo} alt="Solcito Logo" style={{ height: '90px', objectFit: 'contain' }} />
              <div className="d-flex flex-column align-items-center">
                <span className="sidebar-brand-text login-cursive-brand" style={{ fontSize: '3rem' }}>Solcito</span>
                <span className="sidebar-subbrand-text login-subbrand" style={{ fontSize: '0.8rem', marginTop: '-6px' }}>BLANQUERIA</span>
              </div>
            </div>
            <h2 className="login-card-title">Ingreso al Sistema</h2>
            <p className="login-card-subtitle">Introduce tu usuario y contraseña para acceder.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error-alert" role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className="login-input-group">
              <label className="login-input-label" htmlFor="username">
                Usuario
              </label>
              <div className="login-input-wrapper">
                <input
                  id="username"
                  type="text"
                  className="login-input"
                  placeholder="Introduce tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
                <FiUser className="login-input-icon" />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-input-label" htmlFor="password">
                Contraseña
              </label>
              <div className="login-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <FiLock className="login-input-icon" />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn">
              <span>Ingresar</span>
              <FiLogIn />
            </button>
          </form>
        </div>

        <footer className="login-footer-branding">
          <div>
            &copy; {new Date().getFullYear()} Solcito Blanquería.
          </div>
          <div>
            Desarrollado por{' '}
            <a
              href="https://www.cubocode.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}
              className="hover-underline"
            >
              Cubo
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Login;
