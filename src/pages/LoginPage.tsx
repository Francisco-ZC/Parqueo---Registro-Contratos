import React, { useState } from 'react';
import { login } from '../services/authService';

export function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

    async function handleSubmit(
    event: React.SyntheticEvent<HTMLFormElement>
    ) {
    event.preventDefault();

    // Validación básica
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f4f4',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h1
          style={{
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          Gestión de Parqueos
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cccccc',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cccccc',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                color: '#d32f2f',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#1976d2',
              color: '#ffffff',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}