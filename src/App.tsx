/**
 * APP.TSX — Router principal
 * ==========================
 * Maneja el estado global de la app:
 * - Autenticación
 * - Vista activa (dashboard / detalle / reportes)
 * - Lista de clientes y pagos (se reemplazará con llamadas a Firestore)
 * - Toasts globales
 * - Apertura de modales
 *
 * ESTRUCTURA DE NAVEGACIÓN:
 *   LoginPage  
 *   AppShell (sidebar + topbar)
 *     ├── DashboardPage
 *     ├── ClienteDetailPage
 *     └── ReportesPage
 *
 * INTEGRACIÓN CON FIRESTORE (próximo paso):
 * Reemplazá los arrays MOCK_* por llamadas a los servicios:
 *   - obtenerAlquileresActivos()  → alquilerService
 *   - obtenerTodosLosPagos()      → pagoService
 * Y los handlers (handleConfirmarPago, handleGuardarCliente, etc.)
 * por llamadas reales a los servicios con await.
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';

// Páginas
import DashboardPage      from './pages/DashboardPage';
import ClienteDetailPage  from './pages/ClienteDetailPage';
import ReportesPage       from './pages/ReportesPage';

// Componentes compartidos
import Sidebar              from './components/Sidebar';
import NuevoClienteModal    from './components/NuevoClienteModal.tsx';
import ConfirmarPagoModal   from './components/ConfirmarPagoModal';
import { ToastArea }        from './components/Uicomponents';

// Tipos
import type { Cliente, Pago, ToastItem, ToastType } from './models/Types';

// Utilidades
import { addPeriod, todayISO }  from './utils/DateUtils';

// CSS global — importar aquí UNA SOLA VEZ
import './css/variables.css';
import './css/components.css';
import './App.css'; // tus estilos actuales de App

// ─────────────────────────────────────────────────────────────
// DATOS DE PRUEBA
// Cuando conectes Firestore, eliminá estos mocks y usá useEffect
// para cargar datos reales al montar el componente.
// ─────────────────────────────────────────────────────────────
function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
}
function daysFromNow(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
}

const MOCK_CLIENTES: Cliente[] = [
  {
    id: 'c1', nombre: 'Carlos Mora Jiménez', cedula: '1-0852-0341',
    telefono: '8845-2211', correo: 'carlos.mora@gmail.com', createdAt: daysAgo(180),
    alquileres: [
      { placa: 'AAA-123', clienteId: 'c1', tipoVehiculo: 'liviano', tipoContrato: 'diurno', periodo: 'mensual', monto: 30000, proximoPago: daysFromNow(3),  ultimaFechaPago: daysAgo(27), estado: 'activo' },
    ],
  },
  {
    id: 'c2', nombre: 'María Solís Vega', cedula: '2-1234-5678',
    telefono: '7712-3344', correo: 'msolis@hotmail.com', createdAt: daysAgo(90),
    alquileres: [
      { placa: 'BBB-456', clienteId: 'c2', tipoVehiculo: 'moto',    tipoContrato: 'diurno',   periodo: 'mensual', monto: 15000, proximoPago: daysFromNow(18), ultimaFechaPago: daysAgo(12), estado: 'activo' },
      { placa: 'BBB-789', clienteId: 'c2', tipoVehiculo: 'liviano', tipoContrato: 'nocturno', periodo: 'mensual', monto: 30000, proximoPago: daysFromNow(18), ultimaFechaPago: daysAgo(12), estado: 'activo' },
    ],
  },
  {
    id: 'c3', nombre: 'Andrés Quirós Brenes', cedula: '3-0567-8901',
    telefono: null, correo: 'andresq@empresa.co.cr', createdAt: daysAgo(365),
    alquileres: [
      { placa: 'CCC-111', clienteId: 'c3', tipoVehiculo: 'pesado', tipoContrato: 'ambos', periodo: 'mensual', monto: 90000, proximoPago: daysAgo(2),      ultimaFechaPago: daysAgo(32), estado: 'activo' },
    ],
  },
  {
    id: 'c4', nombre: 'Lucía Fernández Torres', cedula: '4-2345-6789',
    telefono: '6698-4455', correo: null, createdAt: daysAgo(60),
    alquileres: [
      { placa: 'DDD-222', clienteId: 'c4', tipoVehiculo: 'liviano', tipoContrato: 'diurno', periodo: 'quincenal', monto: 15000, proximoPago: daysFromNow(1),  ultimaFechaPago: daysAgo(13), estado: 'activo' },
    ],
  },
  {
    id: 'c5', nombre: 'Roberto Blanco Arce', cedula: '5-8765-4321',
    telefono: '8822-1133', correo: 'rblanco@outlook.com', createdAt: daysAgo(240),
    alquileres: [
      { placa: 'EEE-333', clienteId: 'c5', tipoVehiculo: 'liviano', tipoContrato: 'diurno', periodo: 'mensual', monto: 30000, proximoPago: daysFromNow(22), ultimaFechaPago: daysAgo(8), estado: 'activo' },
      { placa: 'EEE-444', clienteId: 'c5', tipoVehiculo: 'moto',    tipoContrato: 'diurno', periodo: 'mensual', monto: 15000, proximoPago: daysFromNow(22), ultimaFechaPago: daysAgo(8), estado: 'suspendido' },
    ],
  },
  {
    id: 'c6', nombre: 'Diana Castillo Ruiz', cedula: null,
    telefono: '7701-2233', correo: 'diana.c@gmail.com', createdAt: daysAgo(30),
    alquileres: [],
  },
];

const MOCK_PAGOS: Pago[] = [
  { id: 'p1', clienteId: 'c1', placa: 'AAA-123', monto: 30000, fechaPago: daysAgo(27), registradoPor: 'admin@parqueo.com', clienteNombre: 'Carlos Mora Jiménez' },
  { id: 'p2', clienteId: 'c2', placa: 'BBB-456', monto: 15000, fechaPago: daysAgo(12), registradoPor: 'admin@parqueo.com', clienteNombre: 'María Solís Vega' },
  { id: 'p3', clienteId: 'c2', placa: 'BBB-789', monto: 30000, fechaPago: daysAgo(12), registradoPor: 'admin@parqueo.com', clienteNombre: 'María Solís Vega' },
  { id: 'p4', clienteId: 'c3', placa: 'CCC-111', monto: 90000, fechaPago: daysAgo(32), registradoPor: 'admin@parqueo.com', clienteNombre: 'Andrés Quirós Brenes' },
  { id: 'p5', clienteId: 'c4', placa: 'DDD-222', monto: 15000, fechaPago: daysAgo(13), registradoPor: 'admin@parqueo.com', clienteNombre: 'Lucía Fernández Torres' },
  { id: 'p6', clienteId: 'c5', placa: 'EEE-333', monto: 30000, fechaPago: daysAgo(8),  registradoPor: 'admin@parqueo.com', clienteNombre: 'Roberto Blanco Arce' },
];

// ─────────────────────────────────────────────────────────────
// INNER ROUTER — solo se monta cuando el usuario está autenticado
// ─────────────────────────────────────────────────────────────
type ActiveView = 'dashboard' | 'detalle' | 'reportes';

function AppRouter() {
  const { firebaseUser, loading } = useAuth();

  // Estado de navegación
  const [activeView, setActiveView]       = useState<ActiveView>('dashboard');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Datos (reemplazar con Firestore)
  const [clientes, setClientes] = useState<Cliente[]>(MOCK_CLIENTES);
  const [pagos, setPagos]       = useState<Pago[]>(MOCK_PAGOS);

  // Modales
  const [showNuevoCliente, setShowNuevoCliente]         = useState(false);
  const [clienteParaPago, setClienteParaPago]           = useState<Cliente | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function addToast(msg: string, type: ToastType = 'success') {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  // ── Pantalla de carga ──
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-head)', color: 'var(--text-3)' }}>
        Cargando…
      </div>
    );
  }

  // ── Login ──
  if (!firebaseUser) return <LoginPage />;

  // ── Datos del usuario actual (vendrá de la colección /usuario en Firestore) ──
  const usuario = {
    email:   firebaseUser.email ?? 'admin@parqueo.com',
    nombre:  firebaseUser.displayName ?? 'Administrador',
    usuario: 'admin',
  };

  // ─── HANDLERS ────────────────────────────────────────────────

  /**
   * Confirmar pago:
   * 1. Avanza proximoPago y guarda ultimaFechaPago en cada alquiler activo
   * 2. Crea un registro de Pago en el historial
   *
   * TODO al conectar Firestore:
   *   await confirmarPagoYAvanzar(placa);   ← por cada alquiler activo
   *   await crearPago({ clienteId, placa, monto, registradoPor: usuario.email });
   */
  function handleConfirmarPago(cliente: Cliente, registradoPor: string) {
    // Actualizar alquileres en la lista local
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id !== cliente.id) return c;
        return {
          ...c,
          alquileres: c.alquileres.map((a) => {
            if (a.estado !== 'activo') return a;
            const nuevaFecha = addPeriod(a.proximoPago, a.periodo);
            return { ...a, ultimaFechaPago: a.proximoPago, proximoPago: nuevaFecha };
          }),
        };
      })
    );

    // Registrar pago en el historial local
    const activos   = cliente.alquileres.filter((a) => a.estado === 'activo');
    const monto     = activos.reduce((s, a) => s + a.monto, 0);
    const nuevoPago: Pago = {
      id:             'p' + Date.now(),
      clienteId:      cliente.id,
      placa:          activos.map((a) => a.placa).join(', '),
      monto,
      fechaPago:      todayISO(),
      registradoPor,
      clienteNombre:  cliente.nombre,
    };
    setPagos((p) => [nuevoPago, ...p]);

    setClienteParaPago(null);
    addToast(`Pago de ${cliente.nombre} confirmado. ${new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(monto)}.`, 'success');
  }

  /**
   * Guardar nuevo cliente:
   * TODO al conectar Firestore:
   *   const ref = await crearCliente(clienteInput);
   *   for (const alq of alquileres) await crearAlquiler({ ...alq, clienteId: ref.id });
   */
  function handleGuardarCliente(data: Parameters<typeof import('./components/NuevoClienteModal.tsx').default>[0]['onGuardar'] extends (d: infer D) => void ? D : never) {
    const nuevoCliente: Cliente = {
      id:        'c' + Date.now(),
      nombre:    data.nombre,
      cedula:    data.cedula || null,
      telefono:  data.telefono || null,
      correo:    data.correo || null,
      createdAt: todayISO(),
      alquileres: data.alquileres.map((v) => ({
        placa:           v.placa,
        clienteId:       'c' + Date.now(), // el ID real vendrá de Firestore
        tipoVehiculo:    v.tipoVehiculo,
        tipoContrato:    v.tipoContrato,
        periodo:         v.periodo,
        monto:           v.monto,
        proximoPago:     v.fechaPrimerPago,
        ultimaFechaPago: v.fechaPrimerPago,
        estado:          'activo' as const,
      })),
    };
    setClientes((c) => [...c, nuevoCliente]);
    addToast(`Cliente "${data.nombre}" guardado correctamente.`, 'success');
  }

  /**
   * Suspender / reactivar un alquiler:
   * TODO al conectar Firestore:
   *   await cambiarEstadoAlquiler(placa, nuevoEstado);
   */
  function handleSuspender(
    clienteId: string,
    placa: string,
    nuevoEstado: 'activo' | 'suspendido'
  ) {
    setClientes((prev) =>
      prev.map((c) =>
        c.id !== clienteId
          ? c
          : {
              ...c,
              alquileres: c.alquileres.map((a) =>
                a.placa !== placa ? a : { ...a, estado: nuevoEstado }
              ),
            }
      )
    );
  }

  /**
   * Cerrar sesión:
   * TODO: await authService.logout();
   */
  function handleLogout() {
    addToast('Cerrando sesión…', 'warn');
    // authService.logout();
  }

  // ─── TOPBAR TITLES ────────────────────────────────────────────
  const viewConfig: Record<ActiveView, { title: string; sub: string }> = {
    dashboard: { title: 'Dashboard',           sub: 'Resumen general del parqueo' },
    detalle:   { title: 'Detalle de cliente',  sub: selectedCliente?.nombre ?? '' },
    reportes:  { title: 'Reportes de pagos',   sub: 'Historial completo de cobros' },
  };
  const { title, sub } = viewConfig[activeView];

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView === 'detalle' ? 'dashboard' : activeView}
        onNavigate={(view) => setActiveView(view)}
        onNuevoCliente={() => setShowNuevoCliente(true)}
        usuario={usuario}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            {sub && <div className="topbar-sub">{sub}</div>}
          </div>
          <div className="topbar-actions">
            <div className="topbar-date">
              {new Date().toLocaleDateString('es-CR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </div>
          </div>
        </header>

        {/* Cuerpo de la página */}
        <div className="page-body">
          {activeView === 'dashboard' && (
            <DashboardPage
              clientes={clientes}
              onClienteClick={(c) => { setSelectedCliente(c); setActiveView('detalle'); }}
              onNuevoCliente={() => setShowNuevoCliente(true)}
              onConfirmarPago={(c) => setClienteParaPago(c)}
              onVerReportes={() => setActiveView('reportes')}
            />
          )}

          {activeView === 'detalle' && selectedCliente && (
            <ClienteDetailPage
              // Siempre buscamos el cliente actualizado en la lista
              cliente={clientes.find((c) => c.id === selectedCliente.id) ?? selectedCliente}
              onBack={() => setActiveView('dashboard')}
              onSuspender={handleSuspender}
              addToast={addToast}
            />
          )}

          {activeView === 'reportes' && (
            <ReportesPage
              pagos={pagos}
              onBack={() => setActiveView('dashboard')}
            />
          )}
        </div>
      </main>

      {/* Modales globales */}
      <NuevoClienteModal
        open={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        onGuardar={handleGuardarCliente}
      />

      <ConfirmarPagoModal
        open={!!clienteParaPago}
        cliente={clienteParaPago}
        registradoPor={usuario.email}
        onClose={() => setClienteParaPago(null)}
        onConfirmar={handleConfirmarPago}
      />

      {/* Toasts */}
      <ToastArea toasts={toasts} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}