import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  User as FirebaseUser,
  UserCredential 
} from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: "AIzaSyANdTHShC_C_7eF8Lr3CdARGvfJlZJ9pWw",
  authDomain: "parking-252f9.firebaseapp.com",
  projectId: "parking-252f9",
  storageBucket: "parking-252f9.appspot.com",
  messagingSenderId: "296089790099",
  appId: "1:296089790099:web:f4a7b6cffb1ff6c0f3cf66",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = async (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
};

export const loginWithEmail = async (
  email: string, 
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (
  email: string, 
  password: string
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async (): Promise<void> => {
  return signOut(auth);
};

export { auth, app };
export type { FirebaseUser };
