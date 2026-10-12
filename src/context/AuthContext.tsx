import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRoleType } from '../types';
import { INITIAL_USERS } from '../services/SeedData';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User;
  allUsers: User[];
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  canAccess: (allowedRoles: UserRoleType[]) => boolean;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (userId: string, userData: Partial<User>) => void;
  deleteUser: (userId: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Carrega lista de usuários do LocalStorage ou do seed
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('vidrogestao_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Erro ao ler vidrogestao_users:', e);
      }
    }
    return INITIAL_USERS;
  });

  // Salva lista de usuários sempre que alterada
  useEffect(() => {
    localStorage.setItem('vidrogestao_users', JSON.stringify(allUsers));
  }, [allUsers]);

  // Sessão de autenticação sempre ativa (abertura direta sem login)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const adminUser = allUsers.find((u) => u.role === 'ADMINISTRADOR') || {
      id: 'usr-admin-1',
      name: 'Administrador do Sistema',
      email: 'comercial@vidracaria.com.br',
      role: 'ADMINISTRADOR',
      maxDiscountPercent: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    return { ...adminUser, maxDiscountPercent: 100 };
  });

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Regra direta: "admin" / "admin" loga como Administrador
    if (cleanUser === 'admin' && cleanPass === 'admin') {
      const adminUser = allUsers.find((u) => u.role === 'ADMINISTRADOR') || allUsers[0];
      setCurrentUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('vidrogestao_is_authenticated', 'true');
      localStorage.setItem('vidrogestao_current_user', JSON.stringify(adminUser));
      return { success: true };
    }

    // Busca por email ou nome
    const userMatch = allUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanUser ||
        u.name.toLowerCase() === cleanUser ||
        u.name.toLowerCase().includes(cleanUser)
    );

    if (userMatch) {
      if (!userMatch.isActive) {
        return {
          success: false,
          error: 'Esta conta de usuário foi desativada pelo administrador.',
        };
      }

      // Valida senha cadastrada ou padrão 'admin' / '123456'
      const validPassword = userMatch.password ? userMatch.password === cleanPass : (cleanPass === 'admin' || cleanPass === '123456');

      if (validPassword) {
        setCurrentUser(userMatch);
        setIsAuthenticated(true);
        localStorage.setItem('vidrogestao_is_authenticated', 'true');
        localStorage.setItem('vidrogestao_current_user', JSON.stringify(userMatch));
        return { success: true };
      }
    }

    return {
      success: false,
      error: 'Credenciais inválidas. Verifique usuário e senha.',
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('vidrogestao_is_authenticated');
  };

  const switchUser = (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('vidrogestao_current_user', JSON.stringify(target));
    }
  };

  const canAccess = (allowedRoles: UserRoleType[]): boolean => {
    if (currentUser.role === 'ADMINISTRADOR') return true;
    return allowedRoles.includes(currentUser.role);
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAllUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = (userId: string, userData: Partial<User>) => {
    setAllUsers((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          const updated = {
            ...user,
            ...userData,
            updatedAt: new Date().toISOString(),
          };
          // Se o usuário editado for o atual logado, atualiza o estado e storage
          if (currentUser.id === userId) {
            setCurrentUser(updated);
            localStorage.setItem('vidrogestao_current_user', JSON.stringify(updated));
          }
          return updated;
        }
        return user;
      })
    );
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    if (currentUser.id === userId) {
      return {
        success: false,
        error: 'Você não pode excluir o usuário que está atualmente logado.',
      };
    }

    const target = allUsers.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const adminsRemaining = allUsers.filter((u) => u.role === 'ADMINISTRADOR' && u.id !== userId);
    if (target.role === 'ADMINISTRADOR' && adminsRemaining.length === 0) {
      return {
        success: false,
        error: 'Não é possível excluir o único administrador do sistema.',
      };
    }

    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        allUsers,
        login,
        logout,
        switchUser,
        canAccess,
        createUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  return context;
};
