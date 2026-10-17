import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { 
  Package, Plus, Trash2, Eye, PauseCircle, PlayCircle, 
  CheckCircle, ArrowLeft, Edit3, Repeat, ExternalLink, AlertCircle 
} from 'lucide-react';
import { getAuthUser, type UserSession } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';

export default function MarketplaceMyAds() {
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ativos' | 'pausados' | 'vendidos'>('ativos');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(contextUser);

  useEffect(() => {
    checkUserAndFetchAds();
  }, [contextUser]);

  const checkUserAndFetchAds = async () => {
    const user = contextUser || (await getAuthUser());
    if (!user) {
      alert('🔒 Por favor, faça login na sua conta para acessar seus anúncios.');
      navigate('/login?redirect=/marketplace/meus-anuncios');
      return;
    }
    setCurrentUser(user);
    fetchAds(user);
  };

  const fetchAds = async (user: UserSession) => {
    setLoading(true);

    // 1. Buscar na tabela oficial
    const { data: listings } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 2. Buscar imagens primárias dos listings
    const imagesMap: Record<string, string> = {};
    if (listings && listings.length > 0) {
      const ids = listings.map(l => l.id);
      try {
        const { data: imgs } = await supabase
          .from('marketplace_listing_images')
          .select('listing_id, image_url, is_primary')
          .in('listing_id', ids);
        if (imgs) {
          imgs.forEach(img => {
            if (!imagesMap[img.listing_id] || img.is_primary) {
              imagesMap[img.listing_id] = img.image_url;
            }
          });
        }
      } catch (_) {}
    }

    // 3. Fallback retroativo para marketplace_items (legado por whatsapp ou nome)
    let legacyItems: any[] = [];
    try {
      const { data: allItems } = await supabase
        .from('marketplace_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allItems) {
        const userCleanPhone = (user.whatsapp || '').replace(/\D/g, '');
        legacyItems = allItems.filter(item => {
          const matchName = Boolean(item.seller_name && user.name && item.seller_name.trim().toLowerCase() === user.name.trim().toLowerCase());
          const itemPhone = (item.seller_whatsapp || '').replace(/\D/g, '');
          const matchPhone = Boolean(userCleanPhone && itemPhone && (itemPhone === userCleanPhone || itemPhone.endsWith(userCleanPhone) || userCleanPhone.endsWith(itemPhone)));
          return matchName || matchPhone;
        });
      }
    } catch (_) {}

    const combined: any[] = [];
    const seen = new Set<string>();

    if (listings) {
      listings.forEach(l => {
        seen.add(l.id);
        combined.push({
          ...l,
          image_url: imagesMap[l.id] || l.image_url || l.image || ''
        });
      });
    }

    if (legacyItems) {
      legacyItems.forEach(item => {
        if (!seen.has(item.id)) {
          combined.push({
            ...item,
            image_url: item.image,
            status: item.status === 'Vendido' ? 'sold' : (item.status === 'Pausado' ? 'paused' : (item.status || 'approved'))
          });
        }
      });
    }

    setAds(combined);
    setLoading(false);
  };

  const handleStatusChange = async (adId: string, newStatus: string) => {
    const isSold = newStatus === 'sold';
    const msg = isSold 
      ? 'Deseja marcar este anúncio como VENDIDO? Ele aparecerá com o selo de Vendido no Marketplace.' 
      : (newStatus === 'paused' ? 'Deseja pausar o anúncio? Ele ficará oculto temporariamente para outros moradores.' : 'Deseja reativar o anúncio?');
    
    if (!confirm(msg)) return;
    
    await supabase.from('marketplace_listings')
      .update({ status: newStatus })
      .eq('id', adId);

    await supabase.from('marketplace_items')
      .update({ status: isSold ? 'Vendido' : (newStatus === 'paused' ? 'Pausado' : 'Ativo') })
      .eq('id', adId);

    if (currentUser) {
      fetchAds(currentUser);
    }
  };

  const handleDelete = async (adId: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este anúncio? Esta ação não pode ser desfeita.")) return;
    
    await supabase.from('marketplace_listing_images').delete().eq('listing_id', adId);
    await supabase.from('marketplace_listings').delete().eq('id', adId);
    await supabase.from('marketplace_items').delete().eq('id', adId);

    if (currentUser) {
      fetchAds(currentUser);
    }
  };

  // Contadores por aba
  const countAtivos = ads.filter(a => a.status === 'approved' || a.status === 'pending' || a.status === 'Ativo').length;
  const countPausados = ads.filter(a => a.status === 'paused' || a.status === 'Pausado').length;
  const countVendidos = ads.filter(a => a.status === 'sold' || a.status === 'Vendido').length;

  const filteredAds = ads.filter(ad => {
    const status = ad.status || 'approved';
    if (activeTab === 'ativos') return status === 'approved' || status === 'pending' || status === 'Ativo';
    if (activeTab === 'pausados') return status === 'paused' || status === 'Pausado';
    if (activeTab === 'vendidos') return status === 'sold' || status === 'Vendido';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] pb-24">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1050px] mx-auto h-[64px] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/marketplace')} 
              className="text-slate-600 hover:text-[#ff6500] font-bold flex items-center gap-1.5 cursor-pointer text-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Marketplace</span>
            </button>
            <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">Meus Anúncios</h1>
          </div>
          
          <button 
            onClick={() => navigate('/marketplace/anunciar')} 
            className="bg-[#ff6500] hover:bg-[#e95600] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer text-xs sm:text-sm shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> <span>Criar Anúncio</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1050px] mx-auto p-4 sm:p-6 mt-2">
        
        {/* ABAS COM CONTADORES */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('ativos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ativos'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Ativos</span>
            <span className="bg-emerald-200/60 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-black">
              {countAtivos}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pausados')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pausados'
                ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Pausados</span>
            <span className="bg-amber-200/60 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-black">
              {countPausados}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vendidos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'vendidos'
                ? 'bg-slate-200 text-slate-800 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Vendidos</span>
            <span className="bg-slate-300 text-slate-800 text-[11px] px-2 py-0.5 rounded-full font-black">
              {countVendidos}
            </span>
          </button>
        </div>

        {/* LISTAGEM OU EMPTY STATE */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-bold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6500] mx-auto mb-3"></div>
            Carregando seus anúncios...
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 bg-orange-50 text-[#ff6500] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📦
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">
              Nenhum anúncio nesta aba
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {activeTab === 'ativos'
                ? 'Você ainda não tem anúncios ativos no momento. Que tal desapegar de algo?'
                : activeTab === 'pausados'
                ? 'Você não possui nenhum anúncio pausado temporariamente.'
                : 'Nenhum anúncio marcado como vendido até o momento.'}
            </p>
            {activeTab === 'ativos' && (
              <button
                onClick={() => navigate('/marketplace/anunciar')}
                className="bg-[#ff6500] hover:bg-[#e95600] text-white px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" /> Criar meu primeiro anúncio
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAds.map(ad => {
              const rawPrice = Number(ad.price);
              const isFree = rawPrice === 0 || ad.type === 'Gratis';
              const isTrade = ad.accepts_trade || ad.type === 'Troca';
              const isCurrentSold = ad.status === 'sold' || ad.status === 'Vendido';
              const isPaused = ad.status === 'paused' || ad.status === 'Pausado';

              return (
                <div
                  key={ad.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors shadow-xs"
                >
                  {/* Foto e Informações */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {ad.image_url ? (
                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📦</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          isCurrentSold ? 'bg-slate-100 text-slate-700' :
                          isPaused ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isCurrentSold ? 'Vendido' : isPaused ? 'Pausado' : 'Ativo'}
                        </span>

                        {isTrade && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                            <Repeat className="w-2.5 h-2.5" /> Troca
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                        {ad.title}
                      </h4>

                      <div className="text-base font-black text-emerald-700 mt-0.5">
                        {isFree ? '🎁 Doação Grátis' : `R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-0.5">
                        📍 {ad.neighborhood || 'Mário Covas'} • Criado recentemente
                      </p>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    
                    {/* Visualizar no Marketplace */}
                    <Link
                      to={`/marketplace/anuncio/${ad.id}`}
                      className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Ver anúncio na vitrine"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden md:inline">Ver</span>
                    </Link>

                    {/* Editar Anúncio */}
                    <Link
                      to={`/marketplace/editar/${ad.id}`}
                      className="p-2 sm:px-3 sm:py-2 bg-orange-50 hover:bg-orange-100 text-[#ff6500] rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-orange-200/60"
                      title="Editar informações e fotos"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden md:inline">Editar</span>
                    </Link>

                    {/* Pausar / Reativar */}
                    {!isCurrentSold && (
                      <button
                        onClick={() => handleStatusChange(ad.id, isPaused ? 'approved' : 'paused')}
                        className={`p-2 sm:px-3 sm:py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isPaused
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        }`}
                        title={isPaused ? "Reativar anúncio" : "Pausar anúncio"}
                      >
                        {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                        <span className="hidden md:inline">{isPaused ? 'Reativar' : 'Pausar'}</span>
                      </button>
                    )}

                    {/* Marcar Vendido */}
                    {!isCurrentSold && (
                      <button
                        onClick={() => handleStatusChange(ad.id, 'sold')}
                        className="p-2 sm:px-3 sm:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
                        title="Marcar como vendido"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden md:inline">Vendido</span>
                      </button>
                    )}

                    {/* Excluir Definitivamente */}
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="p-2 sm:px-3 sm:py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200"
                      title="Excluir permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
