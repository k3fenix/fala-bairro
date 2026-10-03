import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Heart, Share2, MessageCircle, AlertTriangle, User, MapPin } from 'lucide-react';

export default function MarketplaceAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchAd();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      checkFavorite(user.id);
    }
  };

  const fetchAd = async () => {
    setLoading(true);
    const { data } = await supabase.from('marketplace_listings').select('*').eq('id', id).single();
    if (data) {
      setAd(data);
      // Fetch seller info
      const { data: sellerData } = await supabase.from('profiles').select('name, avatar, created_at').eq('id', data.user_id).single();
      if (sellerData) setSeller(sellerData);
    }
    setLoading(false);
  };

  const checkFavorite = async (userId: string) => {
    const { data } = await supabase.from('marketplace_favorites').select('*').eq('user_id', userId).eq('listing_id', id).single();
    if (data) setIsFavorite(true);
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      alert("Faça login para favoritar!");
      navigate('/login');
      return;
    }
    if (isFavorite) {
      await supabase.from('marketplace_favorites').delete().eq('user_id', currentUser.id).eq('listing_id', id);
      setIsFavorite(false);
    } else {
      await supabase.from('marketplace_favorites').insert({ user_id: currentUser.id, listing_id: id });
      setIsFavorite(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title,
          text: `Confira este anúncio no Fala do Bairro: ${ad.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Erro ao compartilhar', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  const openChat = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // Lógica para abrir chat (Sistema de conversas v3)
    const { data: existingChat } = await supabase.from('marketplace_conversations')
      .select('id')
      .eq('listing_id', ad.id)
      .eq('buyer_id', currentUser.id)
      .single();

    if (existingChat) {
      alert("Abrindo chat existente... (Implementação de UI de Chat em breve)");
    } else {
      const { data: newChat, error } = await supabase.from('marketplace_conversations')
        .insert({ listing_id: ad.id, buyer_id: currentUser.id, seller_id: ad.user_id })
        .select('id')
        .single();
      if (!error && newChat) {
        alert("Novo chat criado! (Implementação de UI de Chat em breve)");
      }
    }
  };

  const openWhatsApp = () => {
    if (ad.whatsapp) {
      const wpp = String(ad.whatsapp).replace(/\D/g, '');
      window.open(`https://wa.me/${wpp}?text=Olá! Vi seu anúncio "${ad.title}" no Fala do Bairro.`, '_blank');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-medium text-slate-500">Carregando anúncio...</div>;
  if (!ad) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-800 text-xl">Anúncio não encontrado.</div>;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2433] pb-24">
      {/* Header Simples */}
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-50">
        <div className="max-w-[1000px] mx-auto h-[60px] flex items-center px-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-medium hover:text-[#ff6500] transition-colors">
            <ArrowLeft className="w-5 h-5" /> Voltar
          </button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto p-4 sm:p-6 mt-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
          {/* Esquerda: Fotos */}
          <div className="w-full md:w-1/2 bg-slate-100 aspect-square md:aspect-auto md:min-h-[500px] relative flex items-center justify-center">
             <div className="text-[80px] opacity-20">📦</div>
             <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded-lg font-bold text-xs uppercase shadow-sm">
               {ad.type || 'Venda'} • {ad.condition || 'Usado'}
             </div>
          </div>

          {/* Direita: Info */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col">
            <div className="flex justify-between items-start mb-2">
               <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{ad.title}</h1>
               <div className="flex gap-2 shrink-0 ml-4">
                 <button onClick={handleShare} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                   <Share2 className="w-5 h-5" />
                 </button>
                 <button onClick={toggleFavorite} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                   <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                 </button>
               </div>
            </div>

            <div className="text-[32px] sm:text-[40px] font-black text-[#16a34a] mb-6 leading-none">
              {Number(ad.price) > 0 ? `R$ ${Number(ad.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Grátis'}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-5 h-5 text-[#ff6500]" />
                <span>{ad.neighborhood}, {ad.city} - {ad.state}</span>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">Descrição</h3>
                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">{ad.description || 'Sem descrição'}</p>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
               <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                   {seller?.avatar ? (
                     <img src={seller.avatar} alt="Seller" className="w-12 h-12 rounded-full object-cover" />
                   ) : (
                     <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                       <User className="w-6 h-6 text-slate-400" />
                     </div>
                   )}
                   <div>
                     <p className="font-bold text-slate-800">{seller?.name || 'Vendedor'}</p>
                     <p className="text-xs text-slate-500">No Fala do Bairro desde {seller?.created_at ? new Date(seller.created_at).getFullYear() : '2024'}</p>
                   </div>
                 </div>
                 <button className="text-xs text-red-500 flex items-center gap-1 font-medium hover:underline">
                   <AlertTriangle className="w-3 h-3" /> Denunciar
                 </button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <button onClick={openChat} className="w-full bg-[#1d2433] hover:bg-black text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                   <MessageCircle className="w-5 h-5" /> Chat Interno
                 </button>
                 {ad.whatsapp && (
                   <button onClick={openWhatsApp} className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                     WhatsApp
                   </button>
                 )}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
