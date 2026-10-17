import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Phone, Mail, Package, Heart, LogOut, 
  ArrowLeft, CheckCircle, Camera, Shield, Bell, Settings,
  AlertTriangle, ExternalLink, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getAuthUser, setAuthUser, clearAuthSession, type UserSession } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../lib/imageUtils';

export default function MarketplaceProfile() {
  const navigate = useNavigate();
  const { user: contextUser, logout: contextLogout } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(contextUser);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Formulário de edição
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      const u = contextUser || (await getAuthUser());
      if (!u) {
        navigate('/login?redirect=/marketplace/perfil');
        return;
      }
      setCurrentUser(u);
      setName(u.name || '');
      setNeighborhood(u.neighborhood || 'Mário Covas');
      setWhatsapp(u.whatsapp || '');
      setAvatar(u.avatar || `https://i.pravatar.cc/150?u=${u.id}`);
    };
    initUser();
  }, [contextUser, navigate]);

  const handleAvatarChange = async (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingAvatar(true);
      try {
        const compressed = await compressImage(e.target.files[0], 400, 400, 0.85);
        setAvatar(compressed);
      } catch (err) {
        console.error('Erro ao comprimir avatar:', err);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      const updatedUser: UserSession = {
        ...currentUser,
        name: name.trim() || currentUser.name,
        neighborhood: neighborhood.trim() || 'Mário Covas',
        whatsapp: whatsapp.trim(),
        avatar: avatar || currentUser.avatar
      };

      // 1. Atualizar sessão local imediata
      setAuthUser(updatedUser);
      setCurrentUser(updatedUser);

      // 2. Atualizar na tabela profiles do Supabase principal
      try {
        await supabase.from('profiles').update({
          name: updatedUser.name,
          full_name: updatedUser.name,
          neighborhood: updatedUser.neighborhood,
          whatsapp: updatedUser.whatsapp,
          avatar: updatedUser.avatar,
          avatar_url: updatedUser.avatar,
        }).eq('id', currentUser.id);
      } catch (_) {}

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert('Erro ao salvar perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente encerrar sua sessão?')) {
      if (contextLogout) {
        await contextLogout();
      } else {
        clearAuthSession();
        try { await supabase.auth.signOut(); } catch (_) {}
      }
      navigate('/marketplace');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6500]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] pb-24">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[760px] mx-auto h-[64px] flex items-center justify-between px-4">
          <button 
            type="button" 
            onClick={() => navigate('/marketplace')} 
            className="flex items-center gap-2 text-slate-600 font-bold hover:text-[#ff6500] transition-colors cursor-pointer text-sm"
          >
            <ArrowLeft className="w-5 h-5" /> Marketplace
          </button>
          <div className="font-extrabold text-slate-900 text-base">
            Minha Conta
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-600 transition-colors p-2 text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Sair da conta"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto p-4 sm:p-6 mt-2 space-y-5">
        
        {/* CARD DO PERFIL RESUMO */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-orange-400 shadow-md">
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            </div>
            <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
              <Camera className="w-5 h-5 mb-0.5" />
              Alterar
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-black px-2.5 py-0.5 rounded-full mb-1 border border-emerald-200">
              <Shield className="w-3 h-3" /> Membro Verificado
            </div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">{name || 'Morador do Bairro'}</h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#ff6500]" /> {neighborhood || 'Mário Covas'} • Campinas - SP
            </p>
            {currentUser.email && (
              <p className="text-[11px] text-slate-400 mt-0.5">{currentUser.email}</p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl text-xs flex items-center gap-1.5 border border-red-200 transition-colors cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair da Conta
              </button>
            </div>
          </div>
        </div>

        {/* ATALHOS RÁPIDOS */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/marketplace/meus-anuncios"
            className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-orange-300 hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff6500] flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              📦
            </div>
            <div>
              <strong className="block text-slate-800 text-xs sm:text-sm font-bold">Meus Anúncios</strong>
              <span className="text-[11px] text-slate-400">Gerenciar produtos</span>
            </div>
          </Link>

          <Link
            to="/marketplace/favoritos"
            className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-red-300 hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              ❤️
            </div>
            <div>
              <strong className="block text-slate-800 text-xs sm:text-sm font-bold">Favoritos</strong>
              <span className="text-[11px] text-slate-400">Anúncios salvos</span>
            </div>
          </Link>
        </div>

        {/* FORMULÁRIO DE EDIÇÃO */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#ff6500]" /> Informações Pessoais
          </h3>

          {savedSuccess && (
            <div className="mb-4 bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Dados atualizados com sucesso!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Nome de Exibição
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome completo ou como deseja ser chamado"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#ff6500] outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Bairro onde mora
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  placeholder="Ex: Mário Covas"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#ff6500] outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  WhatsApp (para compradores entrarem em contato)
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="Ex: 19999999999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#ff6500] outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6500] hover:bg-[#e95600] disabled:bg-orange-300 text-white font-black py-3.5 px-6 rounded-xl shadow-md shadow-orange-500/20 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações do Perfil'}
            </button>
          </form>
        </div>

        {/* OPÇÕES DE PRIVACIDADE E CONTA */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Conta & Privacidade</h4>
          <div className="divide-y divide-slate-100 text-xs font-semibold">
            <button 
              onClick={() => navigate('/feed')}
              className="w-full py-3 flex items-center justify-between text-slate-700 hover:text-blue-600 transition-colors cursor-pointer text-left"
            >
              <span>Ir para o Feed Social do Bairro</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-3 flex items-center justify-between text-red-600 hover:text-red-700 transition-colors cursor-pointer text-left"
            >
              <span>Encerrar sessão no Fala do Bairro</span>
              <LogOut className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
