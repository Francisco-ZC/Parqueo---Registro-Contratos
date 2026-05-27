import { signInWithEmailAndPassword, signOut, onAuthStateChanged} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase'; // import auth instance 

// ─── Login ────────────────────────────────────────────────────────────────────
// LOGIN: recibe email y contraseña, Firebase verifica contra sus servidores
//If credentials are correct, Firebase returns a User object
//Else, an error is launch and will be captured later (componente)
export async function login(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
  // No necesitamos retornar nada: si no lanzó error, el login fue exitoso
  // onAuthStateChanged detectará el cambio automáticamente
}
// ─── Logout ───────────────────────────────────────────────────────────────────
// LOGOUT: invalida la sesión en Firebase y limpia el token local
export async function logout(): Promise<void> {
  await signOut(auth);
}

// LISTENER: llama a `callback` cada vez que cambia el estado de sesión
// Retorna una función "unsubscribe" para limpiar el listener cuando el componente se desmonta
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

