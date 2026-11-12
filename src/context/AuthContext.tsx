import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRoleType, SubscriptionPlan } from '../types';
import { INITIAL_USERS } from '../services/SeedData';
import { BackendApiService } from '../services/BackendApiService';

interface RegisterTenantPayload {
  email: string;
  password: string;
  name: string;
  storeName: string;
  cnpj?: string;
  whatsapp?: string;
  plan: SubscriptionPlan;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User;
  currentPlan: SubscriptionPlan;
  allUsers: User[];
  login: (username: string, password: string) => { success: boolean; error?: string };
  loginWithEmail: (email: string, password: string, preferredPlan?: SubscriptionPlan) => Promise<{ success: boolean; error?: string }>;
  registerTenant: (payload: RegisterTenantPayload) => Promise<{ success: boolean; error?: string }>;
  setSubscriptionPlan: (plan: SubscriptionPlan) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  canAccess: (allowedRoles: UserRoleType[]) => boolean;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (userId: string, userData: Partial<User>) => void;
  deleteUser: (userId: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizePlanValue(raw: unknown): SubscriptionPlan {
  if (!raw) return 'BASICO';
  const cleaned = String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\r\n\t]+/g, '')
    .trim()
    .toUpperCase();
  return cleaned.startsWith('PREM') ? 'PREMIUM' : 'BASICO';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Carrega lista de usuários locais/cadastrados
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

  useEffect(() => {
    localStorage.setItem('vidrogestao_users', JSON.stringify(allUsers));
  }, [allUsers]);

  // Verifica se há sessão autenticada salva
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('vidrogestao_is_authenticated') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedCurrent = localStorage.getItem('vidrogestao_current_user');
    if (savedCurrent) {
      try {
        const parsed = JSON.parse(savedCurrent);
        if (parsed && parsed.id) {
          return {
            ...parsed,
            plan: normalizePlanValue(parsed.plan),
            tenantId: parsed.tenantId || parsed.id,
          };
        }
      } catch {
        // ignore
      }
    }
    const adminUser = allUsers.find((u) => u.role === 'ADMINISTRADOR') || {
      id: 'usr-admin-1',
      tenantId: 'usr-admin-1',
      name: 'Vendedor Comercial',
      email: 'comercial@vidracaria.com.br',
      role: 'ADMINISTRADOR' as UserRoleType,
      plan: 'BASICO' as SubscriptionPlan,
      storeName: 'Minha Vidraçaria',
      maxDiscountPercent: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    return {
      ...adminUser,
      tenantId: adminUser.tenantId || adminUser.id,
      plan: normalizePlanValue(adminUser.plan),
      maxDiscountPercent: 100,
    };
  });

  const currentPlan: SubscriptionPlan = normalizePlanValue(currentUser.plan);

  const setSubscriptionPlan = (plan: SubscriptionPlan) => {
    const normalized = normalizePlanValue(plan);
    setCurrentUser((prev) => {
      const updated: User = {
        ...prev,
        plan: normalized,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('vidrogestao_current_user', JSON.stringify(updated));
      return updated;
    });

    // Atualiza na lista local também
    setAllUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, plan: normalized } : u))
    );
  };

  // Login assíncrono via Supabase Auth Backend + Fallback Local
  const loginWithEmail = async (
    email: string,
    password: string,
    preferredPlan?: SubscriptionPlan
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Atalhos de demonstração rápida para testar Básico vs Premium
    if (
      (cleanEmail === 'basico@vidracaria.com.br' || cleanEmail === 'basico') &&
      (cleanPass === '123456' || cleanPass === 'admin')
    ) {
      const demoBasic: User = {
        id: 'tenant-demo-basico',
        tenantId: 'tenant-demo-basico',
        name: 'Lojista Pacote Básico',
        email: 'basico@vidracaria.com.br',
        role: 'ADMINISTRADOR',
        plan: 'BASICO',
        storeName: 'Vidraçaria Express (Básico)',
        maxDiscountPercent: 100,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(demoBasic);
      setIsAuthenticated(true);
      localStorage.setItem('vidrogestao_is_authenticated', 'true');
      localStorage.setItem('vidrogestao_current_user', JSON.stringify(demoBasic));
      return { success: true };
    }

    if (
      (cleanEmail === 'premium@vidracaria.com.br' || cleanEmail === 'premium') &&
      (cleanPass === '123456' || cleanPass === 'admin')
    ) {
      const demoPremium: User = {
        id: 'tenant-demo-premium',
        tenantId: 'tenant-demo-premium',
        name: 'Lojista Pacote Premium',
        email: 'premium@vidracaria.com.br',
        role: 'ADMINISTRADOR',
        plan: 'PREMIUM',
        storeName: 'Cristal Master ERP (Premium)',
        maxDiscountPercent: 100,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(demoPremium);
      setIsAuthenticated(true);
      localStorage.setItem('vidrogestao_is_authenticated', 'true');
      localStorage.setItem('vidrogestao_current_user', JSON.stringify(demoPremium));
      return { success: true };
    }

    // 2. Tenta autenticar no Supabase via Backend (/api/auth/login)
    const remoteRes = await BackendApiService.loginTenant(cleanEmail, cleanPass);
    if (remoteRes.success && remoteRes.user) {
      const authenticatedUser: User = {
        ...remoteRes.user,
        tenantId: remoteRes.user.tenantId || remoteRes.user.id,
        plan: preferredPlan || remoteRes.user.plan || 'BASICO',
      };
      if (remoteRes.accessToken) {
        localStorage.setItem('vidrogestao_access_token', remoteRes.accessToken);
      }
      setCurrentUser(authenticatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('vidrogestao_is_authenticated', 'true');
      localStorage.setItem('vidrogestao_current_user', JSON.stringify(authenticatedUser));
      return { success: true };
    }

    // 3. Se o servidor respondeu com erro explícito do Supabase Auth (ex: senha incorreta)
    // mas também verificamos se existe na lista local de usuários
    const localResult = login(cleanEmail, cleanPass);
    if (localResult.success) {
      if (preferredPlan) {
        setSubscriptionPlan(preferredPlan);
      }
      return { success: true };
    }

    return {
      success: false,
      error: remoteRes.error || localResult.error || 'E-mail ou senha inválidos.',
    };
  };

  // Cadastro de novo Lojista (Vidraçaria) no Supabase + Local
  const registerTenant = async (
    payload: RegisterTenantPayload
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = payload.email.trim().toLowerCase();

    const remoteRes = await BackendApiService.registerTenant({
      ...payload,
      email: cleanEmail,
    });

    if (!remoteRes.success) {
      return {
        success: false,
        error: remoteRes.error || 'Erro ao cadastrar lojista.',
      };
    }

    const newUser: User = remoteRes.user || {
      id: `tenant-${Date.now()}`,
      tenantId: `tenant-${Date.now()}`,
      name: payload.name.trim(),
      email: cleanEmail,
      password: payload.password,
      role: 'ADMINISTRADOR',
      plan: payload.plan,
      storeName: payload.storeName.trim(),
      maxDiscountPercent: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Salva também na lista local para fallback offline
    setAllUsers((prev) => {
      const filtered = prev.filter((u) => u.email.toLowerCase() !== cleanEmail);
      return [{ ...newUser, password: payload.password }, ...filtered];
    });

    if (remoteRes.accessToken) {
      localStorage.setItem('vidrogestao_access_token', remoteRes.accessToken);
    }

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('vidrogestao_is_authenticated', 'true');
    localStorage.setItem('vidrogestao_current_user', JSON.stringify(newUser));

    return { success: true };
  };

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanUser === 'admin' && cleanPass === 'admin') {
      const adminUser: User = {
        ...(allUsers.find((u) => u.role === 'ADMINISTRADOR') || allUsers[0]),
        tenantId: 'default',
        plan: currentUser.plan || 'BASICO',
      };
      setCurrentUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('vidrogestao_is_authenticated', 'true');
      localStorage.setItem('vidrogestao_current_user', JSON.stringify(adminUser));
      return { success: true };
    }

    const userMatch = allUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanUser ||
        u.name.toLowerCase() === cleanUser
    );

    if (userMatch) {
      if (!userMatch.isActive) {
        return {
          success: false,
          error: 'Esta conta de usuário foi desativada pelo administrador.',
        };
      }

      const validPassword = userMatch.password
        ? userMatch.password === cleanPass
        : cleanPass === 'admin' || cleanPass === '123456';

      if (validPassword) {
        const syncedUser: User = {
          ...userMatch,
          tenantId: userMatch.tenantId || userMatch.id,
          plan: userMatch.plan || 'BASICO',
        };
        setCurrentUser(syncedUser);
        setIsAuthenticated(true);
        localStorage.setItem('vidrogestao_is_authenticated', 'true');
        localStorage.setItem('vidrogestao_current_user', JSON.stringify(syncedUser));
        return { success: true };
      }
    }

    return {
      success: false,
      error: 'E-mail ou senha incorretos.',
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('vidrogestao_is_authenticated');
    localStorage.removeItem('vidrogestao_access_token');
  };

  const switchUser = (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      const synced = {
        ...target,
        tenantId: target.tenantId || target.id,
        plan: target.plan || currentUser.plan || 'BASICO',
      };
      setCurrentUser(synced);
      localStorage.setItem('vidrogestao_current_user', JSON.stringify(synced));
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
      tenantId: currentUser.tenantId || currentUser.id,
      plan: currentUser.plan || 'BASICO',
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
        currentPlan,
        allUsers,
        login,
        loginWithEmail,
        registerTenant,
        setSubscriptionPlan,
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
