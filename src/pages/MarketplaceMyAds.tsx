import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, Plus, Trash2, Eye, PauseCircle, PlayCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { getAuthUser, UserSession } from '../lib/authHelper';

export default function MarketplaceMyAds() {
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ativos');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  useEffect(() => {
    checkUserAndFetchAds();
  }, []);

  const checkUserAndFetchAds = async () => {
    const user = await getAuthUser();
    if (!user) {
      alert('🔒 Por favor, faça login na sua conta para acessar seus anúncios.');
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    fetchAds(user);
  };

  const fetchAds = async (user: UserSession) => {
    setLoading(true);

    const { data } = await supabase.from('marketplace_listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    // Fallback seguro para marketplace_items matching nome ou whatsapp sem erro de sintaxe PostgREST
    let itemsData: any[] = [];
    try {
      const { data: allItems } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });
      if (allItems) {
        const userCleanPhone = (user.whatsapp || '').replace(/\D/g, '');
        itemsData = allItems.filter(item => {
          const matchName = Boolean(item.seller_name && user.name && item.seller_name.trim().toLowerCase() === user.name.trim().toLowerCase());
          const itemPhone = (item.seller_whatsapp || '').replace(/\D/g, '');
          const matchPhone = Boolean(userCleanPhone && itemPhone && (itemPhone === userCleanPhone || itemPhone.endsWith(userCleanPhone) || userCleanPhone.endsWith(itemPhone)));
          return matchName || matchPhone;
        });
      }
    } catch (e) {}

    const combined: any[] = [];
    const seen = new Set();
    if (data) {
      data.forEach(d => { seen.add(d.id); combined.push(d); });
    }
    if (itemsData) {
      itemsData.forEach(item => {
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
      : 'Deseja alterar o status do anúncio?';
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
    if (!confirm("Tem certeza que deseja excluir permanentemente este anúncio?")) return;
    
    await supabase.from('marketplace_listings').delete().eq('id', adId);
    await supabase.from('marketplace_items').delete().eq('id', adId);

    if (currentUser) {
      fetchAds(currentUser);
    }
  };

  const filteredAds = ads.filter(ad => {
    const status = ad.status || 'approved';
    if (activeTab === 'ativos') return status === 'approved' || status === 'pending' || status === 'Ativo';
    if (activeTab === 'pausados') return status === 'paused' || status === 'Pausado';
    if (activeTab === 'vendidos') return status === 'sold' || status === 'Vendido';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2433] pb-24">
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1100px] mx-auto h-[64px] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/marketplace')} className="text-slate-600 hover:text-[#ff6500] font-bold text-xl flex items-center gap-2 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-extrabold text-slate-900">Meus Anúncios</h1>
          </div>
          <button onClick={() => navigate('/marketplace/anunciar')} className="bg-[#ff6500] hover:bg-[#e95600] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-orange-500/20">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Criar Anúncio</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto p-4 sm:p-6 mt-2">
        {/* Abas */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
          {['ativos', 'pausados', 'vendidos'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap capitalize transition-colors cursor-pointer ${
                activeTab === tab 
                ? 'bg-[#1d2433] text-white shadow' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab} ({ads.filter(a => {
                const s = a.status || 'approved';
                if (tab === 'ativos') return s === 'approved' || s === 'pending' || s === 'Ativo';
                if (tab === 'pausados') return s === 'paused' || s === 'Pausado';
                if (tab === 'vendidos') return s === 'sold' || s === 'Vendido';
                return true;
              }).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 font-medium">Carregando seus anúncios...</div>
        ) : filteredAds.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm mt-4">
             <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
             <p className="text-xl font-bold text-slate-800 mb-2">Nenhum anúncio nesta aba.</p>
             <p className="text-slate-500 mb-6">Você não possui itens classificados como {activeTab}.</p>
             <button onClick={() => navigate('/marketplace/anunciar')} className="bg-[#ff6500] hover:bg-[#e95600] text-white px-6 py-3 rounded-2xl font-bold transition-colors cursor-pointer">
               + Anunciar Agora
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAds.map(ad => {
              const imageSrc = ad.image_url || ad.image;
              return (
                <div key={ad.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-md transition-all">
                  <div className="w-full sm:w-[140px] h-[140px] bg-slate-100 rounded-xl flex items-center justify-center shrink-0 cursor-pointer overflow-hidden relative" onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)}>
                    {imageSrc ? (
                      <img src={imageSrc} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl opacity-20">📦</span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-[#ff6500]" onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)}>
                        {ad.title}
                      </h3>
                      <div className="text-[#16a34a] font-black text-lg whitespace-nowrap ml-4">
                        R$ {Number(ad.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-500 mb-3 font-medium">
                      Publicado em {ad.created_at ? new Date(ad.created_at).toLocaleDateString('pt-BR') : 'Hoje'} • {ad.condition || 'Usado'}
                    </div>

                    {/* Badges de status */}
                    <div className="mb-4 flex items-center gap-2">
                      {(ad.status === 'approved' || ad.status === 'Ativo') && <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800">✅ Ativo no Marketplace</span>}
                      {ad.status === 'pending' && <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-100 text-amber-800">⏳ Em Análise</span>}
                      {ad.status === 'paused' && <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-slate-100 text-slate-700">⏸️ Pausado</span>}
                      {ad.status === 'sold' && <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-100 text-blue-800">🎉 Vendido</span>}
                      {ad.accepts_trade && <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-purple-100 text-purple-800">🔄 Aceita Troca</span>}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2 sm:gap-3 pt-3 border-t border-slate-100">
                      <button onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)} className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-blue-600 bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer">
                        <Eye className="w-4 h-4" /> Ver Anúncio
                      </button>
                      
                      {(ad.status === 'approved' || ad.status === 'Ativo') && (
                        <button onClick={() => handleStatusChange(ad.id, 'paused')} className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-amber-600 bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer">
                          <PauseCircle className="w-4 h-4" /> Pausar
                        </button>
                      )}
                      
                      {ad.status === 'paused' && (
                        <button onClick={() => handleStatusChange(ad.id, 'approved')} className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-emerald-600 bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer">
                          <PlayCircle className="w-4 h-4" /> Reativar
                        </button>
                      )}

                      {ad.status !== 'sold' && (
                        <button onClick={() => handleStatusChange(ad.id, 'sold')} className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-blue-600 bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer">
                          <CheckCircle className="w-4 h-4" /> Marcar como Vendido
                        </button>
                      )}

                      {ad.status === 'sold' && (
                        <button onClick={() => handleStatusChange(ad.id, 'approved')} className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors cursor-pointer">
                          <PlayCircle className="w-4 h-4" /> Reativar Venda
                        </button>
                      )}
                      
                      <div className="flex-1"></div>

                      <button onClick={() => handleDelete(ad.id)} className="flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-white hover:bg-red-600 bg-red-50 px-3.5 py-2 rounded-xl transition-colors cursor-pointer" title="Excluir Anúncio">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </button>
                    </div>
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
