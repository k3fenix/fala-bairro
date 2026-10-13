import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { ArrowLeft, Heart, Share2, MessageCircle, AlertTriangle, User, MapPin, Repeat, CheckCircle, PlayCircle } from 'lucide-react';
import { getAuthUser, type UserSession } from '../lib/authHelper';

export default function MarketplaceAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  useEffect(() => {
    fetchAd();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const user = await getAuthUser();
    if (user) {
      setCurrentUser(user);
      checkFavorite(user.id);
    }
  };

  const handleMarkAsSold = async () => {
    if (!confirm('Deseja marcar este anúncio como VENDIDO?')) return;
    await supabase.from('marketplace_listings').update({ status: 'sold' }).eq('id', id);
    await supabase.from('marketplace_items').update({ status: 'Vendido' }).eq('id', id);
    fetchAd();
  };

  const handleReactivate = async () => {
    if (!confirm('Deseja reativar este anúncio no Marketplace?')) return;
    await supabase.from('marketplace_listings').update({ status: 'approved' }).eq('id', id);
    await supabase.from('marketplace_items').update({ status: 'Ativo' }).eq('id', id);
    fetchAd();
  };

  const fetchAd = async () => {
    setLoading(true);

    // 1. Tentar buscar em marketplace_listings
    const { data } = await supabase.from('marketplace_listings').select('*').eq('id', id).single();
    
    if (data) {
      setAd(data);
      
      // Buscar galeria de fotos se existir
      const { data: imagesData } = await supabase.from('marketplace_listing_images').select('image_url').eq('listing_id', data.id).order('order_index');
      if (imagesData && imagesData.length > 0) {
        setGalleryImages(imagesData.map(i => i.image_url));
      } else if (data.image_url || data.image) {
        setGalleryImages([data.image_url || data.image]);
      }

      // Fetch seller info
      if (data.user_id) {
        const { data: sellerData } = await supabase.from('profiles').select('name, avatar, created_at').eq('id', data.user_id).single();
        if (sellerData) setSeller(sellerData);
      }
    } else {
      // 2. Fallback para marketplace_items
      const { data: itemData } = await supabase.from('marketplace_items').select('*').eq('id', id).single();
      if (itemData) {
        const converted = {
          id: itemData.id,
          title: itemData.title,
          description: itemData.description,
          price: itemData.price,
          condition: itemData.condition || 'Usado',
          accepts_trade: itemData.type === 'Troca',
          neighborhood: itemData.neighborhood || 'Bairro Local',
          city: 'Campinas',
          whatsapp: itemData.seller_whatsapp,
          image_url: itemData.image,
          image: itemData.image,
          seller_name: itemData.seller_name,
          status: itemData.status || 'Ativo',
          type: itemData.type,
          category: itemData.category || 'Geral'
        };
        setAd(converted);
        if (itemData.image) setGalleryImages([itemData.image]);
        setSeller({ name: itemData.seller_name || 'Vendedor do Bairro' });
      }
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
      alert('Link do anúncio copiado!');
    }
  };

  const openWhatsApp = () => {
    if (ad.whatsapp) {
      const wpp = String(ad.whatsapp).replace(/\D/g, '');
      const msg = encodeURIComponent(`Olá ${seller?.name || ''}! Vi seu anúncio "${ad.title}" no Fala do Bairro e gostaria de conversar.`);
      window.open(`https://wa.me/55${wpp}?text=${msg}`, '_blank');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-medium text-slate-500">Carregando detalhes do produto...</div>;
  if (!ad) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-800 text-xl">Anúncio não encontrado.</div>;

  const currentImage = galleryImages[selectedImageIndex] || ad.image_url || ad.image;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2433] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1050px] mx-auto h-[60px] flex items-center justify-between px-4">
          <button 
            onClick={() => navigate('/marketplace')} 
            className="flex items-center gap-2 text-slate-600 font-bold hover:text-[#ff6500] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Voltar ao Marketplace
          </button>
          <div className="font-bold text-slate-800 hidden sm:block truncate max-w-xs">{ad.title}</div>
          <div></div>
        </div>
      </header>

      <main className="max-w-[1050px] mx-auto p-4 sm:p-6 mt-4">
        {/* Banner de Vendido */}
        {(ad.status === 'sold' || ad.status === 'Vendido') && (
          <div className="mb-4 bg-red-600 text-white font-black p-4 rounded-2xl flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2 text-sm sm:text-base">
              🏷️ <span>ATENÇÃO: ESTE PRODUTO JÁ FOI VENDIDO!</span>
            </span>
            <span className="text-xs bg-red-700/80 px-3 py-1 rounded-full uppercase tracking-wider">
              Finalizado
            </span>
          </div>
        )}

        {/* Toolbar do Proprietário do Anúncio */}
        {currentUser && (currentUser.id === ad.user_id || currentUser.name === ad.seller_name) && (
          <div className="mb-4 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <span className="text-xs sm:text-sm font-extrabold text-amber-900 flex items-center gap-2">
              ⚙️ <span>Você é o anunciante deste produto:</span>
            </span>
            <div className="flex items-center gap-2">
              {ad.status !== 'sold' && ad.status !== 'Vendido' ? (
                <button 
                  onClick={handleMarkAsSold} 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Marcar como Vendido
                </button>
              ) : (
                <button 
                  onClick={handleReactivate} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <PlayCircle className="w-4 h-4" /> Reativar Anúncio
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          
          {/* LADO ESQUERDO: FOTOS E GALERIA */}
          <div className="w-full md:w-1/2 p-4 bg-slate-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-200 flex items-center justify-center shadow-inner">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt={ad.title} 
                  className="w-full h-full object-contain" 
                />
              ) : (
                <div className="text-[90px] opacity-20">📦</div>
              )}

              {/* Badges Flutuantes */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                <span className="px-3 py-1 bg-black/80 backdrop-blur rounded-lg font-bold text-xs uppercase text-white shadow-md">
                  ✨ {ad.condition || 'Usado'}
                </span>
                {ad.accepts_trade && (
                  <span className="px-3 py-1 bg-purple-600 backdrop-blur rounded-lg font-extrabold text-xs uppercase text-white shadow-md flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5" /> Aceita Troca
                  </span>
                )}
              </div>
            </div>

            {/* Carrossel / Miniaturas */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pt-3">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedImageIndex === idx ? 'border-[#ff6500] scale-105 shadow' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LADO DIREITO: INFORMAÇÕES E CONTATO */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col">
            <div className="flex justify-between items-start mb-3 gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{ad.title}</h1>
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={handleShare} 
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Compartilhar"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={toggleFavorite} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  title="Favoritar"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* PREÇO OU BADGE DE TROCA */}
            <div className="mb-6">
              {ad.accepts_trade || ad.type === 'Troca' ? (
                <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-2xl font-black text-lg shadow-sm">
                  <Repeat className="w-5 h-5 text-purple-600" />
                  <span>Disponível para Troca</span>
                </div>
              ) : Number(ad.price) > 0 ? (
                <div className="text-3xl sm:text-4xl font-black text-[#16a34a] leading-none">
                  R$ {Number(ad.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-2xl font-black text-lg shadow-sm">
                  🎁 Doação Grátis
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <MapPin className="w-5 h-5 text-[#ff6500]" />
                <span>📍 {ad.neighborhood || 'Bairro Local'}, {ad.city || 'Campinas'}</span>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wider">Descrição do Anúncio</h3>
                <p className="text-slate-700 whitespace-pre-wrap text-base leading-relaxed">{ad.description || 'Sem descrição cadastrada.'}</p>
              </div>
            </div>

            {/* ANUNCIANTE E CONTATO */}
            <div className="mt-auto pt-6 border-t border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  {seller?.avatar ? (
                    <img src={seller.avatar} alt="Seller" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-[#ff6500] font-bold flex items-center justify-center text-lg">
                      👤
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{seller?.name || ad.seller_name || 'Vendedor do Bairro'}</p>
                    <p className="text-xs text-slate-500">Membro verificado do Fala do Bairro</p>
                  </div>
                </div>
              </div>

              {ad.status === 'sold' || ad.status === 'Vendido' ? (
                <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-inner">
                  🔒 Este anúncio foi finalizado (Produto Vendido)
                </div>
              ) : ad.whatsapp ? (
                <button 
                  onClick={openWhatsApp} 
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20 text-lg cursor-pointer"
                >
                  💬 Negociar no WhatsApp
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
