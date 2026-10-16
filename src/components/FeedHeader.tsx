import React, { useState } from 'react';
import { 
  Menu, X, MapPin, ChevronDown, Share2, Dog, Store, User, 
  LogOut, Megaphone, ChevronRight, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeedHeaderProps {
  userName: string;
  userAvatar: string;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (n: string) => void;
  allNeighborhoods: string[];
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  handleLogout: () => void;
  handleCopyInvite: () => void;
  setShowPetsModal: (show: boolean) => void;
  setShowBusinessModal: (show: boolean) => void;
  setShowProfile: (show: boolean) => void;
  globalAnnouncement?: string;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  userName,
  userAvatar,
  selectedNeighborhood,
  setSelectedNeighborhood,
  allNeighborhoods,
  activeFilter,
  setActiveFilter,
  handleLogout,
  handleCopyInvite,
  setShowPetsModal,
  setShowBusinessModal,
  setShowProfile,
  globalAnnouncement,
}) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const firstName = userName ? userName.split(' ')[0] : 'Vizinho';
  const resolvedAvatar = userAvatar || `https://i.pravatar.cc/150?u=${userName}`;

  const navTabs = [
    { id: 'Mural', label: 'Mural do Bairro', icon: '📰' },
    { id: 'Minhas Publicações', label: 'Minhas Publicações', icon: '✍️' },
    { id: 'Notícias', label: 'Notícias da Região', icon: '📢' },
    { id: 'Área Pet', label: 'Área Pet', icon: '🐾' },
    { id: 'Guia Local', label: 'Guia Local', icon: '🏪' },
    { id: 'Vendas & Trocas', label: 'Marketplace', icon: '🛒' }
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'Vendas & Trocas') {
      navigate('/marketplace');
    } else {
      setActiveFilter(tabId);
    }
    setDrawerOpen(false);
  };

  return (
    <>
      {/* =========================================================================
          BARRA DE NAVEGAÇÃO SUPERIOR FIXA (CLEAN, MODERNA E ELEGANTE)
          ========================================================================= */}
      <header className={`bg-white/95 backdrop-blur-md sticky ${typeof window !== 'undefined' && localStorage.getItem('impersonatedUser') ? 'top-[72px]' : 'top-10'} z-40 border-b border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]`}>
        <div className="max-w-md mx-auto md:max-w-2xl px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            
            {/* LADO ESQUERDO: Foto do Usuário + Saudação (Toque abre o perfil) */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer group min-w-0"
              onClick={() => setShowProfile(true)}
              title="Toque para editar seu perfil"
            >
              <div className="relative">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#ff6500] to-amber-400 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <img 
                    src={resolvedAvatar} 
                    alt={userName} 
                    className="w-full h-full object-cover rounded-full bg-white"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-sm sm:text-base font-black text-slate-900 truncate">{firstName}</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                    Ativo
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold block truncate">Toque para ver perfil</span>
              </div>
            </div>

            {/* LADO DIREITO: Seletor de Bairro + Botão Hambúrguer no canto direito onde foca a mão */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Bairro Pill */}
              <div className="relative flex items-center bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-full px-2.5 py-1.5 transition-all">
                <MapPin className="w-3.5 h-3.5 text-[#ff6500] mr-1 shrink-0" />
                <select 
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="bg-transparent font-extrabold text-slate-800 text-[11px] sm:text-xs appearance-none cursor-pointer outline-none pr-4 max-w-[95px] sm:max-w-[130px] truncate"
                  aria-label="Escolher Bairro"
                >
                  {allNeighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
              </div>

              {/* Botão de Menu Hambúrguer NO CANTO DIREITO */}
              <button 
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md shadow-orange-500/20 active:scale-95"
                title="Abrir Menu Lateral"
                aria-label="Abrir Menu"
              >
                <Menu className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MENU LATERAL GAVETA NO LADO DIREITO (DRAWER DIREITO ELEGANTE)
          ========================================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop escurecido */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Painel Lateral que desliza da DIREITA para a esquerda */}
          <div className="relative w-[300px] sm:w-[340px] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            
            {/* Topo da Sidebar com Fechar e Logo */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-orange-500/10 to-amber-500/5">
              <div className="flex items-center gap-2.5">
                <img src="/logo-fala-bairro.svg" alt="Fala do Bairro" className="w-9 h-9 object-contain drop-shadow-sm" />
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">Fala do Bairro</h3>
                  <span className="text-[10px] font-extrabold text-[#ff6500] uppercase tracking-wider block">Área do Morador</span>
                </div>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                aria-label="Fechar Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cartão de Perfil do Usuário com Foto Grande */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-[#ff6500] to-amber-400 shrink-0 shadow-sm overflow-hidden">
                  <img 
                    src={resolvedAvatar} 
                    alt={userName} 
                    className="w-full h-full object-cover rounded-[14px] bg-white"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-black text-slate-900 truncate">{userName}</h4>
                  <p className="text-xs text-[#ff6500] font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" /> {selectedNeighborhood}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Morador Conectado
                  </span>
                </div>
              </div>

              {/* Botão de Editar Perfil */}
              <button 
                onClick={() => { setShowProfile(true); setDrawerOpen(false); }}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 transition-all flex items-center justify-between cursor-pointer shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Editar Foto e Nome
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Lista de Opções do Menu */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2">
                Navegação Principal
              </div>

              {navTabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold transition-all cursor-pointer text-left ${
                      isActive 
                        ? 'bg-orange-50 text-[#ff6500] border border-orange-200/80 shadow-xs' 
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#ff6500]"></span>}
                  </button>
                );
              })}

              <div className="pt-4 border-t border-slate-100 mt-4 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2">
                Recursos do Bairro
              </div>

              {/* Minha Empresa */}
              <button 
                onClick={() => { setShowBusinessModal(true); setDrawerOpen(false); }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <span>Minha Empresa / Comércio</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Meus Pets */}
              <button 
                onClick={() => { setShowPetsModal(true); setDrawerOpen(false); }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-800 transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Dog className="w-4 h-4" />
                  </div>
                  <span>Cadastrar Pet Perdido</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Convidar Vizinhos */}
              <button 
                onClick={() => { handleCopyInvite(); setDrawerOpen(false); }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span>Convidar Vizinho no WhatsApp</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Ir para o Portal Inicial */}
              <button 
                onClick={() => { navigate('/'); setDrawerOpen(false); }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <span>Página Inicial do Portal</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Rodapé da Sidebar: Botão Sair da Conta */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => { setDrawerOpen(false); handleLogout(); }}
                className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-200/80"
              >
                <LogOut className="w-4 h-4" /> Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARD DE ALERTA / AVISO OFICIAL REESTILIZADO */}
      {globalAnnouncement && (
        <div className="max-w-md mx-auto md:max-w-2xl px-4 mt-4 mb-2">
          <div className="relative overflow-hidden rounded-2xl shadow-[0_10px_30px_rgb(37,99,235,0.18)] border border-blue-400/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 sm:p-5">
            <div className="relative z-10 flex gap-3.5 items-start sm:items-center">
              <div className="bg-white/20 p-2.5 rounded-2xl shrink-0 backdrop-blur-md shadow-inner border border-white/20">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  </span>
                  <h4 className="font-extrabold text-[11px] uppercase tracking-widest text-blue-100">Comunicado Oficial</h4>
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/95">
                  {globalAnnouncement}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedHeader;
