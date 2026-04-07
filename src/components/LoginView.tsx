import React from 'react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Car, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginView() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Verifique seu e-mail para redefinir a senha.');
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });
        if (error) throw error;
        setMessage('Conta criada! Verifique seu e-mail para confirmar.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="UPARK Logo" className="h-24 object-contain mb-4" onError={(e) => {
            // Fallback if logo is missing
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }} />
          <div className="hidden flex-col items-center">
            <div className="w-20 h-20 bg-[#FFD700] rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,215,0,0.3)]">
              <Car size={40} className="text-[#0A192F]" />
            </div>
            <h1 className="text-4xl font-bold tracking-wider text-white">UPARK</h1>
          </div>
          <p className="text-slate-400 mt-2 text-center">
            {isForgotPassword 
              ? 'Redefinir sua senha' 
              : isLogin 
                ? 'Bem-vindo de volta, motorista!' 
                : 'Junte-se à comunidade UPARK'}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
              <AlertCircle size={16} />
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Car size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-colors"
                    placeholder="Seu nome"
                    required={!isLogin && !isForgotPassword}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFD700] text-[#0A192F] font-bold py-3 rounded-xl shadow-lg hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 mt-2"
            >
              {loading 
                ? 'Aguarde...' 
                : isForgotPassword 
                  ? 'Enviar link de recuperação' 
                  : isLogin 
                    ? 'Entrar' 
                    : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {!isForgotPassword && (
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-[#FFD700] hover:underline block w-full"
              >
                Esqueci minha senha
              </button>
            )}
            
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setIsLogin(!isLogin);
                setError('');
                setMessage('');
              }}
              className="text-sm text-slate-400 hover:text-white transition-colors block w-full mt-4"
            >
              {isForgotPassword 
                ? 'Voltar para o login' 
                : isLogin 
                  ? 'Não tem uma conta? Cadastre-se' 
                  : 'Já tem uma conta? Entre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
