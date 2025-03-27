import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, FirebaseUser } from "@/services/firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: () => {},
  clearUser: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is authenticated on first load
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Clear the user data
  const clearUser = () => {
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    setUser,
    clearUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
