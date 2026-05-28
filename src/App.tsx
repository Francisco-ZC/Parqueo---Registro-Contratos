/**
 * APP.TSX — correcciones
 * ========================
 * Fix 1: campos opcionales vacíos no se envían a Firestore (evita undefined)
 * Fix 3: logout conectado a authService
 */

import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";

import { useClientes } from "./hooks/useClientes";
import { usePagos }    from "./hooks/usePagos";

import DashboardPage     from "./pages/DashboardPage";
import ClienteDetailPage from "./pages/ClienteDetailPage";
import ReportesPage      from "./pages/ReportesPage";

import Sidebar            from "./components/Sidebar";
import NuevoClienteModal  from "./components/NuevoClienteModal";
import ConfirmarPagoModal from "./components/ConfirmarPagoModal";
import { ToastArea }      from "./components/Uicomponents";

import { crearCliente }                                                    from "./services/clienteService";
import { crearAlquiler, confirmarPagoYAvanzar }    from "./services/alquilerService";
//cambiarEstadoAlquiler
import { crearPago }                                                       from "./services/pagoService";
import { logout }                                                          from "./services/authService"; // ← Fix 3
import { Timestamp }                                                       from "firebase/firestore";

import type { Cliente, ClienteInput, ToastItem, ToastType } from "./models/Types";
//import { todayISO } from "./utils/DateUtils";

import "./css/variables.css";
import "./css/components.css";
import "./App.css";

type ActiveView = "dashboard" | "detalle" | "reportes";

function AppRouter() {
  const { firebaseUser, loading: authLoading } = useAuth();

  const {
    clientes,
    loading:  clientesLoading,
    error:    clientesError,
    recargar: recargarClientes,
  } = useClientes();

  const {
    pagos,
    loading:  pagosLoading,
    recargar: recargarPagos,
  } = usePagos();

  const [activeView, setActiveView]           = useState<ActiveView>("dashboard");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [clienteParaPago, setClienteParaPago]   = useState<Cliente | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function addToast(msg: string, type: ToastType = "success") {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  if (authLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", fontFamily: "var(--font-head)", color: "var(--text-3)",
      }}>
        Cargando…
      </div>
    );
  }

  if (!firebaseUser) return <LoginPage />;

  const usuario = {
    email:   firebaseUser.email  ?? "",
    nombre:  firebaseUser.displayName ?? "Administrador",
    usuario: "admin",
  };

  // ─── HANDLERS ─────────────────────────────────────────────────

  async function handleConfirmarPago(cliente: Cliente, registradoPor: string) {
    const activos = cliente.alquileres.filter((a) => a.estado === "activo");
    try {
      await Promise.all(
        activos.map(async (alquiler) => {
          await confirmarPagoYAvanzar(alquiler.placa);
          await crearPago({
            clienteId:     cliente.id,
            placa:         alquiler.placa,
            monto:         alquiler.monto,
            registradoPor,
            clienteNombre: cliente.nombre,
          });
        })
      );
      await Promise.all([recargarClientes(), recargarPagos()]);
      const total = activos.reduce((s, a) => s + a.monto, 0);
      addToast(`Pago de ${cliente.nombre} confirmado. ₡${total.toLocaleString("es-CR")}.`, "success");
    } catch (err) {
      console.error("Error confirmando pago:", err);
      addToast("Error al confirmar el pago. Intentá de nuevo.", "error");
    } finally {
      setClienteParaPago(null);
    }
  }

  /**
   * FIX 1 — campos opcionales vacíos
   * ==================================
   * Firestore no acepta `undefined` como valor de campo.
   * Si mandamos { telefono: undefined }, lanza el error que viste.
   *
   * La solución es construir el objeto de entrada solo con los campos
   * que tienen valor real, usando un objeto parcial y spread condicional:
   *
   *   ...(valor ? { campo: valor } : {})
   *
   * Si `valor` es '' (vacío), la condición es falsa y el campo
   * simplemente no existe en el objeto — Firestore lo acepta sin problema.
   */
  async function handleGuardarCliente(data: ClienteInput) {
    try {
      const nuevoCliente = await crearCliente({
        nombre: data.nombre,
        // Solo incluimos el campo si tiene contenido real
        ...(data.cedula.trim()    ? { cedula:    data.cedula.trim()    } : {}),
        ...(data.telefono.trim()  ? { telefono:  data.telefono.trim()  } : {}),
        ...(data.correo.trim()    ? { correo:    data.correo.trim()    } : {}),
      });

      if (data.alquileres.length > 0) {
        await Promise.all(
          data.alquileres.map((alq) =>
            crearAlquiler({
              placa:           alq.placa,
              clienteId:       nuevoCliente.id,
              tipoVehiculo:    alq.tipoVehiculo,
              tipoContrato:    alq.tipoContrato,
              periodo:         alq.periodo,
              monto:           alq.monto,
              fechaPrimerPago: Timestamp.fromDate(
                new Date(alq.fechaPrimerPago + "T00:00:00")
              ),
            })
          )
        );
      }

      await recargarClientes();
      addToast(`Cliente "${data.nombre}" guardado correctamente.`, "success");
    } catch (err) {
      console.error("Error guardando cliente:", err);
      addToast("Error al guardar el cliente. Intentá de nuevo.", "error");
    }
  }

  /**
   * FIX 3 — logout conectado
   * =========================
   * Llamamos a logout() de authService.
   * Cuando Firebase cierra la sesión, onAuthChange() en useAuth
   * detecta el cambio automáticamente y setea firebaseUser = null,
   * lo que hace que AppRouter renderice <LoginPage /> sin necesidad
   * de hacer nada más.
   */
  async function handleLogout() {
    try {
      await logout();
      // No hace falta navegar manualmente — useAuth lo detecta solo
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      addToast("Error al cerrar sesión.", "error");
    }
  }

  const viewConfig: Record<ActiveView, { title: string; sub: string }> = {
    dashboard: { title: "Dashboard",          sub: "Resumen general del parqueo" },
    detalle:   { title: "Detalle de cliente", sub: selectedCliente?.nombre ?? "" },
    reportes:  { title: "Reportes de pagos",  sub: "Historial completo de cobros" },
  };
  const { title, sub } = viewConfig[activeView];
  const datosLoading = clientesLoading || pagosLoading;

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView === "detalle" ? "dashboard" : activeView}
        onNavigate={(view) => setActiveView(view)}
        onNuevoCliente={() => setShowNuevoCliente(true)}
        usuario={usuario}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            {sub && <div className="topbar-sub">{sub}</div>}
          </div>
          <div className="topbar-actions">
            <div className="topbar-date">
              {new Date().toLocaleDateString("es-CR", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </div>
          </div>
        </header>

        <div className="page-body">
          {datosLoading && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 200, color: "var(--text-3)", fontFamily: "var(--font-head)", gap: 10,
            }}>
              <span style={{ animation: "pulse 1.5s infinite" }}>⏳</span>
              Cargando datos…
            </div>
          )}

          {clientesError && !datosLoading && (
            <div style={{
              margin: "24px 0", padding: "16px 20px",
              background: "var(--danger-bg)", border: "1px solid var(--danger-bd)",
              borderRadius: "var(--radius-md)", color: "var(--danger)",
              fontFamily: "var(--font-head)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              ⚠ {clientesError}
              <button className="btn btn-danger-soft btn-sm" style={{ marginLeft: "auto" }} onClick={recargarClientes}>
                Reintentar
              </button>
            </div>
          )}

          {!datosLoading && !clientesError && (
            <>
              {activeView === "dashboard" && (
                <DashboardPage
                  clientes={clientes}
                  onClienteClick={(c) => { setSelectedCliente(c); setActiveView("detalle"); }}
                  onNuevoCliente={() => setShowNuevoCliente(true)}
                  onConfirmarPago={(c) => setClienteParaPago(c)}
                  onVerReportes={() => setActiveView("reportes")}
                />
              )}

              {activeView === "detalle" && selectedCliente && (
                <ClienteDetailPage
                  cliente={clientes.find((c) => c.id === selectedCliente.id) ?? selectedCliente}
                  onBack={() => setActiveView("dashboard")}
                  onDatosActualizados={recargarClientes}   // ← reemplaza onSuspender
                  addToast={addToast}
                />
              )}

              {activeView === "reportes" && (
                <ReportesPage
                  pagos={pagos}
                  onBack={() => setActiveView("dashboard")}
                />
              )}
            </>
          )}
        </div>
      </main>

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

      <ToastArea toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}