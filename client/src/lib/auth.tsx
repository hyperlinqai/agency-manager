import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: { id: string; name: string; email: string; role: string; token: string; refreshToken?: string } | null;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ requiresTwoFactor?: boolean } | void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, twoFactorCode }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Login failed");
    }

    const data = await response.json();
    
    // Check if 2FA is required
    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true };
    }

    // Login successful
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

