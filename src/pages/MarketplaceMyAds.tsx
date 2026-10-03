import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, Plus, Trash2, Eye, PauseCircle, PlayCircle, CheckCircle } from 'lucide-react';

export default function MarketplaceMyAds() {
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ativos');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkUserAndFetchAds();
  }, []);

  const checkUserAndFetchAds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    fetchAds(user.id);
  };

  const fetchAds = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase.from('marketplace_listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setAds(data);
    setLoading(false);
  };

  const handleStatusChange = async (adId: string, newStatus: string) => {
    if(!confirm(`Tem certeza que deseja mudar o status para ${newStatus}?`)) return;
    
    const { error } = await supabase.from('marketplace_listings')
      .update({ status: newStatus })
      .eq('id', adId)
      .eq('user_id', currentUser.id);

    if (!error) {
      fetchAds(currentUser.id);
    } else {
      alert("Erro ao alterar status do anúncio.");
    }
  };

  const handleDelete = async (adId: string) => {
    if(!confirm("Tem certeza que deseja excluir permanentemente este anúncio?")) return;
    
    const { error } = await supabase.from('marketplace_listings')
      .delete()
      .eq('id', adId)
      .eq('user_id', currentUser.id);

    if (!error) {
      fetchAds(currentUser.id);
    } else {
      alert("Erro ao excluir anúncio.");
    }
  };

  // Filtragem local baseada na aba
  const filteredAds = ads.filter(ad => {
    if (activeTab === 'ativos') return ad.status === 'approved' || ad.status === 'pending';
    if (activeTab === 'pausados') return ad.status === 'paused';
    if (activeTab === 'vendidos') return ad.status === 'sold';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2433] pb-24">
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-40">
        <div className="max-w-[1250px] mx-auto h-[70px] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/marketplace')} className="text-slate-500 hover:text-[#ff6500] font-bold text-xl mr-2">
              ←
            </button>
            <h1 className="text-xl font-bold">Meus Anúncios</h1>
          </div>
          <button onClick={() => navigate('/marketplace/anunciar')} className="bg-[#ff6500] hover:bg-[#e95600] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Criar Anúncio</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto p-4 sm:p-6 mt-4">
        {/* Abas */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
          {['ativos', 'pausados', 'vendidos'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap capitalize transition-colors ${
                activeTab === tab 
                ? 'bg-[#1d2433] text-white' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab} ({ads.filter(a => {
                if (tab === 'ativos') return a.status === 'approved' || a.status === 'pending';
                if (tab === 'pausados') return a.status === 'paused';
                if (tab === 'vendidos') return a.status === 'sold';
                return true;
              }).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Carregando seus anúncios...</div>
        ) : filteredAds.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 shadow-sm mt-4">
             <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
             <p className="text-xl font-bold text-slate-700 mb-2">Nenhum anúncio nesta categoria.</p>
             <p>Você ainda não tem anúncios {activeTab}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAds.map(ad => (
              <div key={ad.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full sm:w-[140px] h-[140px] bg-slate-100 rounded-xl flex items-center justify-center shrink-0 cursor-pointer" onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)}>
                  <span className="text-4xl opacity-20">📦</span>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-2 cursor-pointer hover:text-[#ff6500]" onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)}>
                      {ad.title}
                    </h3>
                    <div className="text-[#16a34a] font-black text-lg whitespace-nowrap ml-4">
                      R$ {Number(ad.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-500 mb-4">
                    Publicado em {new Date(ad.created_at).toLocaleDateString('pt-BR')} • {ad.condition || 'Usado'}
                  </div>

                  {/* Badges de status */}
                  <div className="mb-4 flex items-center gap-2">
                    {ad.status === 'pending' && <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">Em Análise</span>}
                    {ad.status === 'approved' && <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700">Ativo</span>}
                    {ad.status === 'paused' && <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">Pausado</span>}
                    {ad.status === 'sold' && <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700">Vendido</span>}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 sm:gap-3 pt-3 border-t border-slate-100">
                    <button onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)} className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-blue-600 bg-slate-50 px-3 py-2 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" /> Ver
                    </button>
                    
                    {(ad.status === 'approved' || ad.status === 'pending') && (
                      <button onClick={() => handleStatusChange(ad.id, 'paused')} className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-amber-600 bg-slate-50 px-3 py-2 rounded-lg transition-colors">
                        <PauseCircle className="w-4 h-4" /> Pausar
                      </button>
                    )}
                    
                    {ad.status === 'paused' && (
                      <button onClick={() => handleStatusChange(ad.id, 'approved')} className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-green-600 bg-slate-50 px-3 py-2 rounded-lg transition-colors">
                        <PlayCircle className="w-4 h-4" /> Reativar
                      </button>
                    )}

                    {ad.status !== 'sold' && (
                      <button onClick={() => handleStatusChange(ad.id, 'sold')} className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-blue-600 bg-slate-50 px-3 py-2 rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" /> Vendi
                      </button>
                    )}
                    
                    {/* Spacer para jogar o lixo pra direita */}
                    <div className="flex-1"></div>

                    <button onClick={() => handleDelete(ad.id)} className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 bg-red-50 px-3 py-2 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
