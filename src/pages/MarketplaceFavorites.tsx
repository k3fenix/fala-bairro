import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { 
  Heart, Search, Star, ArrowLeft, Trash2, Repeat, 
  MapPin, ShoppingBag, Eye 
} from 'lucide-react';
import { getAuthUser, type UserSession } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';

export default function MarketplaceFavorites() {
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(contextUser);

  useEffect(() => {
    checkUserAndFetchFavorites();
  }, [contextUser]);

  const checkUserAndFetchFavorites = async () => {
    const user = contextUser || (await getAuthUser());
    if (!user) {
      alert('🔒 Faça login para ver seus anúncios favoritos.');
      navigate('/login?redirect=/marketplace/favoritos');
      return;
    }
    setCurrentUser(user);
    fetchFavorites(user.id);
  };

  const fetchFavorites = async (userId: string) => {
    setLoading(true);
    
    // Buscar favoritos vinculados
    const { data, error } = await supabase
      .from('marketplace_favorites')
      .select('*, marketplace_listings(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const validFavs = data.filter(f => f.marketplace_listings);

      // Buscar imagens principais para esses listings
      if (validFavs.length > 0) {
        const listingIds = validFavs.map(f => f.marketplace_listings.id);
        const { data: imgs } = await supabase
          .from('marketplace_listing_images')
          .select('listing_id, image_url, is_primary')
          .in('listing_id', listingIds);

        const imgMap: Record<string, string> = {};
        if (imgs) {
          imgs.forEach(img => {
            if (!imgMap[img.listing_id] || img.is_primary) {
              imgMap[img.listing_id] = img.image_url;
            }
          });
        }

        const enriched = validFavs.map(f => ({
          ...f,
          ad: {
            ...f.marketplace_listings,
            image_url: imgMap[f.marketplace_listings.id] || f.marketplace_listings.image_url || f.marketplace_listings.image
          }
        }));
        setFavorites(enriched);
      } else {
        setFavorites([]);
      }
    }
    setLoading(false);
  };

  const handleRemoveFavorite = async (adId: string) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('marketplace_favorites')
      .delete()
      .eq('listing_id', adId)
      .eq('user_id', currentUser.id);

    if (!error) {
      setFavorites(prev => prev.filter(f => f.listing_id !== adId));
    }
  };

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
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900">Meus Favoritos</h1>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {favorites.length} {favorites.length === 1 ? 'item salvo' : 'itens salvos'}
          </span>
        </div>
      </header>

      <main className="max-w-[1050px] mx-auto p-4 sm:p-6 mt-2">
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-bold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-3"></div>
            Carregando seus favoritos...
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              ❤️
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Nenhum favorito salvo ainda</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Quando você gostar de um produto no Marketplace, clique no coração para salvá-lo e encontrá-lo facilmente aqui.
            </p>
            <button 
              onClick={() => navigate('/marketplace')} 
              className="bg-[#ff6500] hover:bg-[#e95600] text-white px-6 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-orange-500/20"
            >
              <Search className="w-4 h-4" /> Explorar Produtos no Bairro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {favorites.map((fav) => {
              const ad = fav.ad || fav.marketplace_listings;
              const rawPrice = Number(ad.price);
              const isPriceDefined = !isNaN(rawPrice) && rawPrice > 0;
              const isPureTrade = ad.type === 'Troca';
              const isPureGratis = ad.type === 'Gratis' || ad.type === 'Doacao' || ad.type === 'Doação';
              const isTrade = isPureTrade || Boolean(ad.accepts_trade);
              const isFree = isPureGratis || (!isPureTrade && !isTrade && !isPriceDefined && ad.type !== 'Venda');
              const isSold = ad.status === 'sold' || ad.status === 'Vendido';

              return (
                <div 
                  key={fav.id} 
                  className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative cursor-pointer shadow-xs" 
                  onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)}
                >
                  {/* Foto de Capa em 4:3 */}
                  <div className="aspect-4/3 w-full bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                    {ad.image_url ? (
                      <img 
                        src={ad.image_url} 
                        alt={ad.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="text-4xl opacity-20">📦</div>
                    )}

                    {/* Botão Remover Favorito */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(ad.id);
                      }}
                      className="absolute top-2 right-2 bg-white/95 hover:bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all z-10 cursor-pointer"
                      title="Remover dos favoritos"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </button>

                    {/* Badges de Status */}
                    {isSold ? (
                      <span className="absolute bottom-2 left-2 bg-slate-900/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                        Vendido
                      </span>
                    ) : isPureTrade ? (
                      <span className="absolute bottom-2 left-2 bg-purple-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <Repeat className="w-2.5 h-2.5" /> Troca
                      </span>
                    ) : isFree ? (
                      <span className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                        Doação
                      </span>
                    ) : isTrade ? (
                      <span className="absolute bottom-2 left-2 bg-purple-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <Repeat className="w-2.5 h-2.5" /> Aceita Troca
                      </span>
                    ) : null}
                  </div>
                  
                  {/* Dados do Anúncio */}
                  <div className="p-3.5 flex flex-col flex-1">
                    <div className="text-base font-black mb-1 leading-none">
                      {isPureTrade ? (
                        <span className="text-purple-700 flex items-center gap-1">
                          <Repeat className="w-3.5 h-3.5 text-purple-600 inline" />
                          {isPriceDefined ? `Troca (R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : 'Troca / Permuta'}
                        </span>
                      ) : isFree ? (
                        <span className="text-emerald-600">🎁 Doação</span>
                      ) : (
                        <span className="text-emerald-600">
                          {isPriceDefined ? `R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ A Combinar'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-tight mb-2">
                      {ad.title}
                    </h3>
                    <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">📍 {ad.neighborhood || 'Mário Covas'}</span>
                      <span className="font-bold text-slate-500 uppercase text-[9px]">{ad.condition || 'Usado'}</span>
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
