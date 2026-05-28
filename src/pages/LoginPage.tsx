import React, { useState } from 'react';
import { login, signInWithGoogle } from '../services/authService'; // Import signInWithGoogle
import '../css/LoginPage.css';

export function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await login(email, password);
    } catch (err) {
      console.error(err);
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      // If sign-in is successful, onAuthStateChanged will handle navigation
    } catch (err) {
      console.error("Error with Google Sign-In:", err);
      setError('No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Gestión de Parqueos</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className={`login-button ${loading ? 'login-button--loading' : ''}`}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="divider">
          <span>---------------   O   ---------------</span>
        </div> 

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={`google-login-button ${loading ? 'google-login-button--loading' : ''}`}
        >
          {loading ? 'Ingresando con Google...' : 'Iniciar sesión con Google'}
        </button>
      </div>
    </div>
  );
}
