import { logout } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import '../css/DashboardPage.css';

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
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-header__title">Sistema de Parqueos</h1>
          <p className="dashboard-header__user">
            Usuario: {firebaseUser?.displayName || firebaseUser?.email}
          </p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Cerrar sesión
        </button>
      </header>

      <main className="dashboard-main">
        <h2 className="dashboard-main__heading">Dashboard Administrativo</h2>

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h3>Clientes</h3>
            <p>Administración de clientes registrados en el sistema.</p>
            <button className="dashboard-card__button dashboard-card__button--blue">
              Ver clientes
            </button>
          </section>

          <section className="dashboard-card">
            <h3>Pagos</h3>
            <p>Control de pagos mensuales, semanales y quincenales.</p>
            <button className="dashboard-card__button dashboard-card__button--green">
              Ver pagos
            </button>
          </section>

          <section className="dashboard-card">
            <h3>Reportes</h3>
            <p>Generación de reportes administrativos y financieros.</p>
            <button className="dashboard-card__button dashboard-card__button--purple">
              Ver reportes
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}