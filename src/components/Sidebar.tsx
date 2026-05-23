/**
 * COMPONENTE: Sidebar
 * ===================
 * Navegación lateral fija. Recibe la vista activa y callbacks para cambiarla.
 *
 * Props:
 * - activeView: qué ítem del menú está seleccionado actualmente
 * - onNavigate: callback para cambiar de vista
 * - onNuevoCliente: abre el modal de nuevo cliente
 * - usuario: datos del usuario autenticado
 * - onLogout: cierra la sesión
 */

import '../css/Sidebar.css';
import type { Usuario } from '../models/Types';

type View = 'dashboard' | 'reportes';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onNuevoCliente: () => void;
  usuario: Usuario;
  onLogout: () => void;
}

export default function Sidebar({
  activeView,
  onNavigate,
  onNuevoCliente,
  usuario,
  onLogout,
}: SidebarProps) {
  // Las iniciales del nombre para el avatar
  const initials = usuario.nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🅿</div>
          <div>
            <div className="logo-text">ParkAdmin</div>
            <div className="logo-sub">Sistema de parqueos</div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Principal</div>

        <button
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <span className="nav-icon">📊</span>
          Dashboard
        </button>

        <button
          className={`nav-item ${activeView === 'reportes' ? 'active' : ''}`}
          onClick={() => onNavigate('reportes')}
        >
          <span className="nav-icon">📋</span>
          Reportes de pagos
        </button>

        <div className="nav-section-label" style={{ marginTop: 8 }}>Acciones</div>

        <button className="nav-item" onClick={onNuevoCliente}>
          <span className="nav-icon">➕</span>
          Nuevo cliente
        </button>
      </nav>

      {/* Footer: usuario + logout */}
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{usuario.nombre}</div>
            <div className="user-email">{usuario.email}</div>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          ↩ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}