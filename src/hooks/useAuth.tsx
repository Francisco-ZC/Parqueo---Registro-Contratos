import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange} from '../services/authService';

// 1. Creamos un "contexto" — una variable global que React puede pasar a cualquier componente
type AuthContextType = {
  firebaseUser: User | null;
  loading: boolean;
};
const AuthContext = createContext<AuthContextType>({firebaseUser: null, loading: true});
type AuthProviderProps = {children: ReactNode;};

// 2. El Provider envuelve toda la app y mantiene el estado de sesión
export function AuthProvider({ children }: AuthProviderProps) {
 const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // true mientras Firebase verifica

  useEffect(() => {
    // 3. Al montar, nos suscribimos a cambios de sesión
    const unsubscribe = onAuthChange((user) => {
      setFirebaseUser(user); // user es null si no hay sesión
      setLoading(false);     // ya sabemos el estado, dejamos de cargar
    });

    // 4. Al desmontar, cancelamos la suscripción (cleanup)
    return unsubscribe;
  }, []); // [] = solo se ejecuta una vez al montar

  return (
    <AuthContext.Provider value={{ firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 5. Cualquier componente puede llamar useAuth() para saber si hay sesión
export function useAuth() {
  return useContext(AuthContext);
}