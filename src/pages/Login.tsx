import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (signInError.message.includes('Email not confirmed')) {
        setError('E-mail não confirmado! (Aviso: O Supabase exige confirmação por padrão. Desative "Confirm Email" no painel do Supabase se desejar acesso direto).');
      } else {
        setError(`Erro: ${signInError.message}`);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (profile) {
        if (profile.status === 'Pendente') {
          setError('Sua conta está em análise. O administrador precisa aprovar seu cadastro.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        if (profile.status === 'Bloqueado') {
          setError('Sua conta foi bloqueada.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        localStorage.setItem('user_auth', 'true');
        localStorage.setItem('user_name', profile.name);
        if (profile.avatar) localStorage.setItem('user_avatar', profile.avatar);
        if (profile.neighborhood) localStorage.setItem('user_neighborhood', profile.neighborhood);
        navigate('/feed');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-md border border-slate-100">
        <h1 className="text-2xl font-black text-slate-800 text-center mb-2">Entrar</h1>
        <p className="text-slate-500 text-center mb-8 text-sm">Bem-vindo de volta ao seu bairro</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700">Senha</label>
              <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">Esqueceu a senha?</a>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl transition-colors mt-6 shadow-md shadow-blue-200"
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Ainda não tem conta? <Link to="/register" className="text-blue-600 font-bold hover:underline">Criar agora</Link>
        </p>
      </div>
    </div>
  );
}
