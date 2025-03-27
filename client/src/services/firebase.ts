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

const firebaseConfig = {
  apiKey: "AIzaSyANdTHShC_C_7eF8Lr3CdARGvfJlZJ9pWw",
  authDomain: "parking-252f9.firebaseapp.com",
  projectId: "parking-252f9",
  storageBucket: "parking-252f9",
  messagingSenderId: "296089790099",
  appId: "1:296089790099:web:f4a7b6cffb1ff6c0f3cf66",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

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
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    console.error("Firebase Signup Error:", error);

    switch (error.code) {
      case "auth/invalid-email":
        throw new Error("The email address is invalid. Please provide a valid email.");
      case "auth/email-already-in-use":
        throw new Error("This email is already in use. Please use a different email.");
      case "auth/weak-password":
        throw new Error("The password is too weak. Please use a stronger password.");
      default:
        throw new Error(error.message || "Failed to register user");
    }
  }
};

export const logoutUser = async (): Promise<void> => {
  return signOut(auth);
};

export { auth, app };
export type { FirebaseUser };
