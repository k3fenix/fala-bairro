import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { setAuthUser } from '../lib/authHelper';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', neighborhood: '', address: '', whatsapp: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '';

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validatePassword = (pwd: string) => {
    return pwd.length >= 6; // Simple validation: at least 6 chars
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }
    if (!validatePassword(formData.password)) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    
    // 1. Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
    });

    if (authError) {
      setError(`Erro ao criar conta: ${authError.message}`);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Create the user profile in our database
      const handle = `@${formData.name.toLowerCase().replace(/\s+/g, '')}`;
      const avatar = `https://i.pravatar.cc/150?u=${formData.name}`;

      const { error: profileError } = await supabase.from('profiles').upsert([
        {
          id: authData.user.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          handle: handle,
          avatar: avatar,
          whatsapp: formData.whatsapp,
          neighborhood: formData.neighborhood,
          address: formData.address,
          status: 'Aprovado'
        }
      ]);

      if (profileError) {
        setError(`Erro ao salvar perfil: ${profileError.message || JSON.stringify(profileError)}`);
        setLoading(false);
        return;
      }

      // Manter a sessão ativa e gravar dados unificados
      localStorage.removeItem('admin_auth');
      const userObj = {
        id: authData.user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        avatar: avatar,
        neighborhood: formData.neighborhood,
        whatsapp: formData.whatsapp
      };
      setAuthUser(userObj);

      setSuccess('🎉 Conta criada com sucesso! Conectando ao Fala do Bairro...');
      setFormData({ name: '', email: '', password: '', confirmPassword: '', neighborhood: '', address: '', whatsapp: '' });
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const target = params.get('redirect') || '/marketplace';
        navigate(target);
      }, 1200);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-md border border-slate-100">
        <h1 className="text-2xl font-black text-slate-800 text-center mb-2">Criar Conta</h1>
        <p className="text-slate-500 text-center mb-6 text-sm">Junte-se à comunidade do seu bairro</p>

        {/* Abas de Autenticação */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 gap-1">
          <Link
            to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
            className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-center rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
          >
            Entrar na minha conta
          </Link>
          <button
            type="button"
            className="flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-white text-blue-600 shadow-xs cursor-default text-center"
          >
            Criar uma conta
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-6 text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl mb-6 text-center font-bold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nome completo</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Ex: João Silva"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp (Privado para Admins)</label>
            <div className="relative">
              <span className="text-slate-400 font-bold absolute left-3 top-3.5">+55</span>
              <input 
                type="tel" 
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Seu Bairro</label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                <input 
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Nome do Bairro"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Logradouro / Rua</label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                <input 
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Nome da Rua"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar Senha</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input 
                type="password" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Repita sua senha"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl transition-colors mt-6 shadow-md shadow-blue-200"
          >
            {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem uma conta?{' '}
          <Link 
            to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'} 
            className="text-blue-600 font-bold hover:underline"
          >
            Entrar na minha conta
          </Link>
        </p>
      </div>
    </div>
  );
}
