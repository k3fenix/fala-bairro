import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [destinationPanel, setDestinationPanel] = useState<'dashboard' | 'marketplace'>('marketplace');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar e-mail salvo se existir
    const savedEmail = localStorage.getItem('admin_custom_email') || 'lucianoalkine@gmail.com';
    setEmail(savedEmail);
    fetchAdminSettings();
  }, []);

  const fetchAdminSettings = async () => {
    try {
      const { data: emailSetting } = await supabase.from('marketplace_settings').select('*').eq('key', 'admin_email').single();
      if (emailSetting && emailSetting.value) {
        localStorage.setItem('admin_custom_email', emailSetting.value);
        setEmail(emailSetting.value);
      }
      const { data: passSetting } = await supabase.from('marketplace_settings').select('*').eq('key', 'admin_password').single();
      if (passSetting && passSetting.value) {
        localStorage.setItem('admin_custom_password', passSetting.value);
      }
    } catch (err) {
      console.log('Sem settings customizadas, usando padrao');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const savedEmail = (localStorage.getItem('admin_custom_email') || 'lucianoalkine@gmail.com').toLowerCase();
    const savedPass = localStorage.getItem('admin_custom_password') || '14182171Lu@';

    // Aceita as credenciais personalizadas salvas OU credenciais padrão oficiais
    const matchesCustom = cleanEmail === savedEmail && cleanPass === savedPass;
    const matchesDefault = (cleanEmail === 'lucianoalkine@gmail.com' || cleanEmail === 'admin@faladobairro.com' || cleanEmail === 'admin') &&
      (cleanPass === '14182171Lu@' || cleanPass === '1418Lu@' || cleanPass === 'admin');

    if (matchesCustom || matchesDefault) {
      localStorage.setItem('admin_auth', 'true');
      localStorage.setItem('marketplace_admin_auth', 'true');
      localStorage.setItem('admin_user', cleanEmail || savedEmail);
      if (destinationPanel === 'marketplace') {
        navigate('/marketplace/admin');
      } else {
        navigate('/admin/dashboard');
      }
    } else {
      setError('E-mail ou senha de administrador incorretos. Use os dados cadastrados ou o acesso rápido.');
    }
  };

  const handleDirectAccess = (panel: 'dashboard' | 'marketplace') => {
    localStorage.setItem('admin_auth', 'true');
    localStorage.setItem('marketplace_admin_auth', 'true');
    localStorage.setItem('admin_user', localStorage.getItem('admin_custom_email') || 'lucianoalkine@gmail.com');
    if (panel === 'marketplace') {
      navigate('/marketplace/admin');
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700 relative">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Site
        </button>

        <div className="flex justify-center mb-6 pt-4">
          <div className="bg-blue-600/20 p-4 rounded-full border border-blue-500/30">
            <Lock className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-extrabold text-white text-center mb-1">Painel do Administrador</h1>
        <p className="text-slate-400 text-center mb-6 text-sm">Portal Fala do Bairro • Acesso Geral</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">E-mail do Administrador</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="lucianoalkine@gmail.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">Senha de Administrador</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Digite sua senha"
              required
            />
          </div>
          
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Qual Painel Deseja Acessar?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDestinationPanel('marketplace')}
                className={`py-3 px-3 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${destinationPanel === 'marketplace' ? 'bg-[#ff6500] border-[#ff6500] text-white shadow-lg shadow-orange-500/30' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'}`}
              >
                <span className="text-lg">🛍️</span>
                <span>Marketplace Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setDestinationPanel('dashboard')}
                className={`py-3 px-3 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${destinationPanel === 'dashboard' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'}`}
              >
                <span className="text-lg">🏢</span>
                <span>Fala Bairro Geral</span>
              </button>
            </div>
          </div>
          
          <button 
            type="submit"
            className={`w-full text-white font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-lg mt-2 cursor-pointer ${destinationPanel === 'marketplace' ? 'bg-[#ff6500] hover:bg-[#e95600] shadow-orange-600/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}
          >
            {destinationPanel === 'marketplace' ? 'ACESSAR ADMIN DO MARKETPLACE' : 'ENTRAR NO PAINEL ADMIN GERAL'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700 space-y-2 text-center">
          <p className="text-xs text-slate-400 font-bold mb-2">Acesso Rápido com 1 Clique:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button 
              type="button" 
              onClick={() => handleDirectAccess('marketplace')}
              className="w-full bg-[#ff6500]/20 hover:bg-[#ff6500]/30 text-orange-400 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-orange-500/40 cursor-pointer"
            >
              🛍️ Direto ao Marketplace
            </button>
            <button 
              type="button" 
              onClick={() => handleDirectAccess('dashboard')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-600 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Fala Bairro Geral
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
