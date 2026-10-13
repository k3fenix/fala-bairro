import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { setAuthUser, getAuthUserSync } from '../lib/authHelper';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '';

  useEffect(() => {
    const user = getAuthUserSync();
    if (user) {
      const target = redirectUrl || '/feed';
      navigate(target, { replace: true });
    }
  }, []);

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
          // Auto-aprovação para liberar o acesso imediato do morador
          await supabase.from('profiles').update({ status: 'Aprovado' }).eq('id', data.user.id);
        }
        if (profile.status === 'Bloqueado') {
          setError('Sua conta foi bloqueada.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        localStorage.removeItem('admin_auth');
        const userObj = {
          id: data.user.id,
          name: profile.name,
          email: data.user.email,
          avatar: profile.avatar || '',
          neighborhood: profile.neighborhood || '',
          whatsapp: profile.whatsapp || ''
        };
        setAuthUser(userObj);
        const params = new URLSearchParams(window.location.search);
        const target = params.get('redirect') || '/feed';
        navigate(target);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-md border border-slate-100">
        <h1 className="text-2xl font-black text-slate-800 text-center mb-2">Entrar</h1>
        <p className="text-slate-500 text-center mb-6 text-sm">Digite seu e-mail e senha para acessar o Fala do Bairro</p>

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
            className="w-full bg-[#ff6500] hover:bg-[#e95600] disabled:bg-orange-300 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all mt-6 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            {loading ? 'ENTRANDO...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem uma conta?{' '}
          <Link 
            to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'} 
            className="text-[#ff6500] font-bold hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
