import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, Search, Star } from 'lucide-react';

export default function MarketplaceFavorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkUserAndFetchFavorites();
  }, []);

  const checkUserAndFetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    fetchFavorites(user.id);
  };

  const fetchFavorites = async (userId: string) => {
    setLoading(true);
    
    // Fetch favorites linking to the listing
    const { data, error } = await supabase
      .from('marketplace_favorites')
      .select('*, marketplace_listings(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setFavorites(data.filter(f => f.marketplace_listings)); // Apenas itens válidos
    }
    setLoading(false);
  };

  const handleRemoveFavorite = async (adId: string) => {
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
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2433] pb-24">
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1250px] mx-auto h-[70px] flex items-center gap-4 px-4 sm:px-6">
          <button onClick={() => navigate('/marketplace')} className="text-slate-500 hover:text-[#ff6500] font-bold text-xl transition-colors">
            ←
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h1 className="text-xl font-bold">Meus Favoritos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto p-4 sm:p-6 mt-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Carregando seus favoritos...</div>
        ) : favorites.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 shadow-sm mt-4">
             <Star className="w-16 h-16 mx-auto mb-4 text-slate-300" />
             <p className="text-xl font-bold text-slate-700 mb-2">Nenhum anúncio favoritado.</p>
             <p className="mb-6">Quando você curtir um anúncio no Marketplace, ele aparecerá aqui para acesso rápido.</p>
             <button onClick={() => navigate('/marketplace')} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 transition-colors">
                <Search className="w-5 h-5" /> Explorar Marketplace
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {favorites.map((fav) => {
              const ad = fav.marketplace_listings;
              return (
                <div key={fav.id} className="bg-white border border-[#e7e7e7] rounded-2xl overflow-hidden hover:shadow-lg transition-all group flex flex-col relative cursor-pointer" onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)}>
                  
                  {/* Imagem (Placeholder por enquanto) */}
                  <div className="aspect-square bg-[#f5f6f8] relative group-hover:opacity-95 transition-opacity flex items-center justify-center">
                    <span className="text-4xl opacity-20">🖼️</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(ad.id);
                      }}
                      className="absolute top-3 right-3 bg-white w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    </button>
                  </div>
                  
                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-xl font-black text-[#ff6500] mb-2">
                      R$ {Number(ad.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </div>
                    <h3 className="font-bold text-[#1d2433] text-sm line-clamp-2 leading-snug mb-3">
                      {ad.title}
                    </h3>
                    <div className="mt-auto text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {ad.condition}
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
