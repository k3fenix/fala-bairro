import React from 'react';
import { MapPin, ChevronDown, Share2, Dog, Store, User, LogOut, Megaphone } from 'lucide-react';
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
  const firstName = userName ? userName.split(' ')[0] : 'Vizinho';

  return (
    <>
    <>
      {/* HEADER DE BOAS-VINDAS MODERNO & OTIMIZADO PARA CELULAR (iOS & Android) */}
      <div className={`bg-white sticky ${typeof window !== 'undefined' && localStorage.getItem('impersonatedUser') ? 'top-[72px]' : 'top-10'} z-40 shadow-xs border-b border-slate-200/80 backdrop-blur-md bg-white/95`}>
        <div className="max-w-md mx-auto md:max-w-2xl px-3 sm:px-4 pt-2.5 pb-2">
          
          {/* Linha 1: Perfil do Usuário + Seletor de Bairro + Botão Sair */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            {/* Usuário logado */}
            <div 
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
              onClick={() => setShowProfile(true)}
              title="Clique para editar seu perfil"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <img 
                  src={userAvatar || `https://i.pravatar.cc/150?u=${userName}`} 
                  alt={userName} 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                    Olá, {firstName}!
                  </h2>
                  <span className="shrink-0 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.2 rounded-full">
                    Ativo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">Toque para ver perfil</p>
              </div>
            </div>

            {/* Ações da Direita: Bairro + Sair */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative flex items-center bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-full px-2.5 py-1 transition-all">
                <MapPin className="w-3.5 h-3.5 text-orange-600 mr-1 shrink-0" />
                <select 
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="bg-transparent font-extrabold text-slate-800 text-[11px] sm:text-xs appearance-none cursor-pointer outline-none pr-4 max-w-[100px] sm:max-w-[130px] truncate"
                >
                  {allNeighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
              </div>

              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-1.5 sm:px-2.5 sm:py-1 rounded-full transition-colors cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Linha 2: Barra de Abas Principais (Instagram / Twitter style) com toque fácil */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 no-scrollbar border-t border-slate-100">
            {[
              { id: 'Mural', label: '📰 Mural' },
              { id: 'Notícias', label: '📢 Notícias' },
              { id: 'Área Pet', label: '🐾 Pets' },
              { id: 'Guia Local', label: '🏪 Guia' },
              { id: 'Vendas & Trocas', label: '🛒 Marketplace' }
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'Vendas & Trocas') {
                      navigate('/marketplace');
                    } else {
                      setActiveFilter(tab.id);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${
                    isActive 
                      ? 'bg-[#ff6500] text-white shadow-sm shadow-orange-500/25 scale-[1.02]' 
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/90 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Linha 3: Ações Rápidas em Chips Elegantes */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 no-scrollbar text-xs">
            <button 
              onClick={() => setShowBusinessModal(true)} 
              className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              <Store className="w-3 h-3 text-amber-600" /> Divulgar Empresa
            </button>
            <button 
              onClick={() => setShowPetsModal(true)} 
              className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              <Dog className="w-3 h-3 text-rose-600" /> Cadastrar Pet
            </button>
            <button 
              onClick={handleCopyInvite} 
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              <Share2 className="w-3 h-3 text-emerald-600" /> Convidar Vizinho
            </button>
          </div>
        </div>
      </div>

      {/* CARD DE ALERTA / AVISO OFICIAL REESTILIZADO */}
      {globalAnnouncement && (
        <div className="max-w-md mx-auto md:max-w-2xl px-4 mt-6 mb-4">
          <div className="relative overflow-hidden rounded-2xl shadow-[0_10px_30px_rgb(37,99,235,0.18)] border border-blue-400/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-6">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 flex gap-4 items-start sm:items-center">
              <div className="bg-white/20 p-3.5 rounded-2xl shrink-0 backdrop-blur-md shadow-inner border border-white/20">
                <Megaphone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                  </span>
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-blue-100">Comunicado Oficial do Bairro</h4>
                </div>
                <p className="text-sm sm:text-[15px] font-medium leading-relaxed text-white/95">
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
