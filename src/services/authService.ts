import { signInWithEmailAndPassword, signOut, onAuthStateChanged,
  GoogleAuthProvider, // Import GoogleAuthProvider
  signInWithPopup, // Import signInWithPopup
} from 'firebase/auth';
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

// ─── Login with Google ──────────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider); // Use signInWithPopup for Google login
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error; // Re-throw the error for the component to handle
  }
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

