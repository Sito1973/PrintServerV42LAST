import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  isAdmin: boolean;
  location?: string;
  floor?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  apiKey: string | null;
  username: string | null;
  name: string | null;
  user: User | null;
  setApiKey: (apiKey: string, username?: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  apiKey: null,
  username: null,
  name: null,
  user: null,
  setApiKey: () => {},
  isAuthenticated: false,
  logout: () => {},
});

export { AuthContext };
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(
    localStorage.getItem('api_key')
  );
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('username')
  );
  const [name, setName] = useState<string | null>(
    localStorage.getItem('name')
  );
  const [user, setUser] = useState<User | null>(null);

  const isAuthenticated = !!apiKey;

  // Obtener datos completos del usuario cuando está autenticado
  useEffect(() => {
    if (apiKey && username && !user) {
      fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
      .then(response => response.json())
      .then(users => {
        const currentUser = users.find((u: User) => u.username === username);
        if (currentUser) {
          setUser(currentUser);
        }
      })
      .catch(error => {
        console.error('Error al obtener datos del usuario:', error);
      });
    }
  }, [apiKey, username, user]);

  const setApiKey = (newApiKey: string | null, newUsername?: string, newName?: string) => {
    console.log("AuthProvider: setApiKey called with:", {
      apiKey: newApiKey ? "Provided" : "Null",
      username: newUsername || "None",
      name: newName || "None"
    });

    if (newApiKey) {
      localStorage.setItem("api_key", newApiKey);
      setApiKeyState(newApiKey);
      console.log("AuthProvider: API key stored in localStorage");

      if (newUsername) {
        localStorage.setItem("username", newUsername);
        setUsername(newUsername);
        console.log("AuthProvider: Username stored:", newUsername);
      }

      if (newName) {
        localStorage.setItem("name", newName);
        setName(newName);
        console.log("AuthProvider: Name stored:", newName);
      }

      // Verify storage and force re-render
      const storedKey = localStorage.getItem("api_key");
      console.log("AuthProvider: Verification - API key in localStorage:", storedKey ? "Yes" : "No");

      // Force a state update to trigger re-renders
      setTimeout(() => {
        window.dispatchEvent(new Event('auth-changed'));
      }, 50);
    } else {
      console.log("AuthProvider: Clearing auth data from localStorage");
      localStorage.removeItem("api_key");
      localStorage.removeItem("username");
      localStorage.removeItem("name");
      setApiKeyState(null);
      setUsername("");
      setName("");
      setUser(null);
    }
  };

  const logout = () => {
    console.log("AuthProvider: Logging out user");

    // Limpiar estado
    setApiKeyState(null);
    setUsername(null);
    setName(null);
    setUser(null);

    // Limpiar localStorage
    localStorage.removeItem('api_key');
    localStorage.removeItem('username');
    localStorage.removeItem('name');

    console.log("AuthProvider: User logged out successfully");

    // Disparar evento personalizado para notificar cambios
    window.dispatchEvent(new Event('auth-changed'));
  };

  const value = {
    isAuthenticated,
    apiKey,
    username,
    name,
    user,
    setApiKey,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;