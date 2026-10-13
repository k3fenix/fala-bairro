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
      {/* HEADER DE BOAS-VINDAS MODERNO (ÁREA DO USUÁRIO) */}
      <div className={`bg-white sticky ${typeof window !== 'undefined' && localStorage.getItem('impersonatedUser') ? 'top-[72px]' : 'top-10'} z-40 shadow-sm border-b border-slate-100`}>
        <div className="max-w-md mx-auto md:max-w-2xl px-4 pt-3 pb-3">
          {/* Linha 1: Saudação e Localização */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowProfile(true)}
                title="Meu Perfil"
              >
                <img 
                  src={userAvatar || `https://i.pravatar.cc/150?u=${userName}`} 
                  alt={userName} 
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Olá, {firstName}! 👋
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                    Morador Ativo
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">O que está acontecendo no seu bairro hoje?</p>
              </div>
            </div>

            {/* Badge de Localização Ativa */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="relative flex items-center bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-full transition-all px-3 py-1.5 shadow-xs group">
                <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mr-1 hidden sm:inline">Bairro:</span>
                <select 
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="bg-transparent font-extrabold text-slate-800 text-xs sm:text-sm appearance-none cursor-pointer outline-none pr-5"
                >
                  {allNeighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>

              {/* Botão Sair */}
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-2.5 py-1.5 rounded-full transition-colors cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Linha 2: Atalhos Rápidos */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={handleCopyInvite} 
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Convidar Vizinho
            </button>
            <button 
              onClick={() => setShowPetsModal(true)} 
              className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Dog className="w-3.5 h-3.5 text-rose-600" /> Meus Pets
            </button>
            <button 
              onClick={() => setShowBusinessModal(true)} 
              className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-amber-600" /> Minha Empresa
            </button>
            <button 
              onClick={() => navigate('/marketplace')} 
              className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <span className="text-orange-500 font-black">🛍️</span> Marketplace
            </button>
            <button 
              onClick={() => setShowProfile(true)} 
              className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-blue-600" /> Meu Perfil
            </button>
          </div>

          {/* Linha 3: Barra de Navegação em Abas Modernas com Alto Contraste */}
          <div className="flex gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar border-t border-slate-100">
            {[
              { id: 'Mural', label: '📰 Mural' },
              { id: 'Notícias', label: '📢 Notícias' },
              { id: 'Área Pet', label: '🐾 Área Pet' },
              { id: 'Guia Local', label: '🏪 Guia Local' },
              { id: 'Vendas & Trocas', label: '🛍️ Vendas & Trocas' }
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'Vendas & Trocas') {
                      navigate(currentUser ? '/marketplace' : '/login?redirect=/marketplace');
                    } else {
                      setActiveFilter(tab.id);
                    }
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
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
