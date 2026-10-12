import React, { useState } from 'react';
import {
  Layers,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Usuário ou senha incorretos.');
      }
      setIsLoading(false);
    }, 200);
  };

  const handleQuickAdminLogin = () => {
    setUsername('admin');
    setPassword('admin');
    const result = login('admin', 'admin');
    if (!result.success) {
      setErrorMessage(result.error || 'Erro ao efetuar login.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Luzes de fundo com tema de vidro e ciano */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Principal de Autenticação */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-cyan-950/40">
          {/* Logo & Marca */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/25 ring-1 ring-white/20 mb-4">
              <Layers className="w-7 h-7" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">
                Vidro<span className="text-cyan-400">Gestão</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ERP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              SaaS Especializado para Vidraçarias e Beneficiamento
            </p>
          </div>

          {/* Dica de Acesso Rápido */}
          <div className="mb-6 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-start gap-3">
            <KeyRound className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <p className="font-semibold text-cyan-300">Acesso Administrador Padrão:</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Usuário: <code className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded">admin</code> • Senha: <code className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded">admin</code>
              </p>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="mb-5 p-3 bg-red-950/50 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Usuário do Sistema
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoCapitalize="none"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-600/30 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                <span>{isLoading ? 'Entrando no Sistema...' : 'Entrar como Administrador'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Login Direto (admin / admin)</span>
              </button>
            </div>
          </form>

          {/* Rodapé do Card */}
          <div className="mt-8 pt-5 border-t border-slate-800/60 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ambiente Pronto para Operação e Testes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
