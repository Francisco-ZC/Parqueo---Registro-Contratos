import { logout } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { firebaseUser } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: '#1e293b',
          color: '#ffffff',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Sistema de Parqueos</h1>

          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              opacity: 0.9,
            }}
          >
            Usuario: {firebaseUser?.displayName || firebaseUser?.email}
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Cerrar sesión
        </button>
      </header>

      {/* Main content */}
      <main
        style={{
          padding: '24px',
        }}
      >
        <h2
          style={{
            marginBottom: '24px',
          }}
        >
          Dashboard Administrativo
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Clientes */}
          <section
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <h3>Clientes</h3>

            <p>
              Administración de clientes registrados en el sistema.
            </p>

            <button
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Ver clientes
            </button>
          </section>

          {/* Pagos */}
          <section
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <h3>Pagos</h3>

            <p>
              Control de pagos mensuales, semanales y quincenales.
            </p>

            <button
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Ver pagos
            </button>
          </section>

          {/* Reportes */}
          <section
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <h3>Reportes</h3>

            <p>
              Generación de reportes administrativos y financieros.
            </p>

            <button
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Ver reportes
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}