import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Initialize state from sessionStorage directly
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const authStatus = sessionStorage.getItem('adminAuth');
    return authStatus === 'true';
  });

  const login = (username: string, password: string): boolean => {
    // Simple authentication - in production, use proper backend authentication
    const validUsername = import.meta.env.VITE_ADMIN_USERNAME as string || 'admin';
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD as string || 'admin123';

    if (username === validUsername && password === validPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// Export the hook in a separate file or use eslint-disable
// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}