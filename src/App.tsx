import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';

function AppRouter() {
  const { firebaseUser, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!firebaseUser) return <LoginPage />;

  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}