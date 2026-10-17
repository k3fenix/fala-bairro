import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { 
  ArrowLeft, Heart, Share2, MessageCircle, AlertTriangle, 
  MapPin, Repeat, CheckCircle, PlayCircle, Edit3, ShieldAlert,
  Clock, Sparkles, X, ChevronRight, Eye
} from 'lucide-react';
import { getAuthUser, type UserSession } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';

export default function MarketplaceAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  
  const [ad, setAd] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(contextUser);

  // Modal de denúncia
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Anúncio suspeito ou golpe');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    fetchAd();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const user = contextUser || (await getAuthUser());
    if (user) {
      setCurrentUser(user);
      checkFavorite(user.id);
    }
  };

  const handleMarkAsSold = async () => {
    if (!confirm('Deseja marcar este anúncio como VENDIDO? Ele ficará visível com o selo de produto finalizado.')) return;
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
      
      // Incrementar contador de visualizações
      try {
        await supabase
          .from('marketplace_listings')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', id);
      } catch (_) {}

      // Buscar galeria de fotos se existir
      const { data: imagesData } = await supabase
        .from('marketplace_listing_images')
        .select('image_url, is_primary')
        .eq('listing_id', data.id)
        .order('order_index');
      
      if (imagesData && imagesData.length > 0) {
        setGalleryImages(imagesData.map(i => i.image_url));
      } else if (data.image_url || data.image) {
        setGalleryImages([data.image_url || data.image]);
      }

      // Buscar informações públicas do vendedor
      if (data.user_id) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('name, full_name, avatar_url, avatar, created_at, neighborhood')
          .eq('id', data.user_id)
          .maybeSingle();
        if (sellerData) setSeller(sellerData);
      }
    } else {
      // 2. Fallback para marketplace_items (legado)
      const { data: itemData } = await supabase.from('marketplace_items').select('*').eq('id', id).single();
      if (itemData) {
        const converted = {
          id: itemData.id,
          title: itemData.title,
          description: itemData.description,
          price: itemData.price,
          condition: itemData.condition || 'Usado',
          accepts_trade: itemData.type === 'Troca',
          neighborhood: itemData.neighborhood || 'Mário Covas',
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
    const { data } = await supabase.from('marketplace_favorites').select('*').eq('user_id', userId).eq('listing_id', id).maybeSingle();
    if (data) setIsFavorite(true);
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      alert("Faça login na sua conta para salvar seus anúncios favoritos!");
      navigate(`/login?redirect=/marketplace/anuncio/${id}`);
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
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link do anúncio copiado para a área de transferência!');
    }
  };

  const openWhatsApp = () => {
    if (ad.whatsapp) {
      const wpp = String(ad.whatsapp).replace(/\D/g, '');
      const sellerDisplayName = seller?.name || seller?.full_name || ad.seller_name || 'Vizinho';
      const msg = encodeURIComponent(`Olá ${sellerDisplayName}! Vi seu anúncio "${ad.title}" no Fala do Bairro e gostaria de conversar.`);
      window.open(`https://wa.me/55${wpp}?text=${msg}`, '_blank');
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSending(true);
    try {
      await supabase.from('marketplace_reports').insert({
        listing_id: id,
        reporter_id: currentUser?.id || null,
        reason: reportReason,
        details: reportDetails.trim(),
        status: 'pending'
      });
      setReportSent(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSent(false);
        setReportDetails('');
      }, 1800);
    } catch (err) {
      alert('Ocorreu um erro ao enviar sua denúncia. Tente novamente mais tarde.');
    } finally {
      setReportSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6500] mr-3"></div>
        Carregando detalhes do produto...
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Anúncio não encontrado</h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6">Este produto pode ter sido removido pelo anunciante ou finalizado.</p>
        <button onClick={() => navigate('/marketplace')} className="bg-[#ff6500] text-white px-6 py-2.5 rounded-xl font-bold text-sm">
          Voltar ao Marketplace
        </button>
      </div>
    );
  }

  const isOwner = currentUser && (
    (ad.user_id && currentUser.id === ad.user_id) || 
    (currentUser.name && ad.seller_name && currentUser.name.trim().toLowerCase() === ad.seller_name.trim().toLowerCase())
  );

  const isSold = ad.status === 'sold' || ad.status === 'Vendido';
  const isTrade = ad.accepts_trade || ad.type === 'Troca';
  const isFree = Number(ad.price) === 0 || ad.type === 'Gratis';
  const currentImage = galleryImages[selectedImageIndex] || ad.image_url || ad.image;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] pb-24">
      
      {/* HEADER NAVEGAÇÃO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1050px] mx-auto h-[60px] flex items-center justify-between px-4">
          <button 
            onClick={() => navigate('/marketplace')} 
            className="flex items-center gap-2 text-slate-600 font-bold hover:text-[#ff6500] transition-colors cursor-pointer text-sm"
          >
            <ArrowLeft className="w-5 h-5" /> Voltar
          </button>
          <div className="font-bold text-slate-800 hidden sm:block truncate max-w-sm text-sm">
            {ad.title}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare} 
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleFavorite} 
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title="Favoritar"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1050px] mx-auto p-4 sm:p-6 mt-2">
        
        {/* BANNER DE VENDIDO */}
        {isSold && (
          <div className="mb-4 bg-slate-900 text-white font-black p-4 rounded-2xl flex items-center justify-between shadow-md">
            <span className="flex items-center gap-2 text-sm sm:text-base">
              🏷️ <span>ESTE PRODUTO JÁ FOI VENDIDO / FINALIZADO</span>
            </span>
            <span className="text-xs bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider text-slate-300">
              Encerrado
            </span>
          </div>
        )}

        {/* BARRA DO PROPRIETÁRIO DO ANÚNCIO */}
        {isOwner && (
          <div className="mb-4 bg-orange-50 border border-orange-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <span className="text-xs sm:text-sm font-extrabold text-orange-950 flex items-center gap-2">
              ⚙️ <span>Você é o anunciante deste produto:</span>
            </span>
            <div className="flex items-center gap-2">
              <Link
                to={`/marketplace/editar/${ad.id}`}
                className="bg-white border border-orange-300 text-orange-800 hover:bg-orange-100/70 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Dados
              </Link>

              {!isSold ? (
                <button 
                  onClick={handleMarkAsSold} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Marcar Vendido
                </button>
              ) : (
                <button 
                  onClick={handleReactivate} 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <PlayCircle className="w-3.5 h-3.5" /> Reativar
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          
          {/* GALERIA ESQUERDA */}
          <div className="w-full md:w-1/2 p-4 bg-slate-50/60 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-200 flex items-center justify-center">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt={ad.title} 
                  className="w-full h-full object-contain bg-white" 
                />
              ) : (
                <div className="text-[80px] opacity-20">📦</div>
              )}

              {/* Badges de tipo */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                <span className="px-3 py-1 bg-black/75 backdrop-blur rounded-lg font-bold text-xs uppercase text-white shadow">
                  ✨ {ad.condition || 'Usado'}
                </span>
                {isTrade && (
                  <span className="px-3 py-1 bg-purple-600 backdrop-blur rounded-lg font-extrabold text-xs uppercase text-white shadow flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> Aceita Troca
                  </span>
                )}
              </div>
            </div>

            {/* Miniaturas de foto */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pt-3">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedImageIndex === idx ? 'border-[#ff6500] scale-105 shadow-sm' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETALHES DIREITA */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col">
            <div className="mb-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                {ad.category || 'Classificados do Bairro'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {ad.title}
              </h1>
            </div>

            {/* PREÇO OU MODALIDADE */}
            <div className="mb-6">
              {isTrade && isFree ? (
                <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 rounded-xl font-black text-lg">
                  <Repeat className="w-5 h-5 text-purple-600" />
                  <span>Disponível para Troca</span>
                </div>
              ) : isFree ? (
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-black text-lg">
                  🎁 Doação Grátis
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-600">
                    R$ {Number(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {isTrade && (
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      Aceita Troca
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* LOCALIZAÇÃO E DETALHES */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <MapPin className="w-4 h-4 text-[#ff6500]" />
                <span>📍 {ad.neighborhood || 'Mário Covas'}, {ad.city || 'Campinas'}</span>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">
                  Descrição do Produto
                </h3>
                <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {ad.description || 'Sem descrição cadastrada pelo anunciante.'}
                </p>
              </div>
            </div>

            {/* VENDEDOR E NEGOCIAÇÃO */}
            <div className="mt-auto pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  {seller?.avatar_url || seller?.avatar ? (
                    <img src={seller.avatar_url || seller.avatar} alt="Seller" className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-orange-100 text-[#ff6500] font-black flex items-center justify-center text-base">
                      👤
                    </div>
                  )}
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{seller?.name || seller?.full_name || ad.seller_name || 'Morador do Bairro'}</p>
                    <p className="text-xs text-slate-400">Anunciante verificado • {ad.neighborhood || 'Bairro Local'}</p>
                  </div>
                </div>

                {/* Botão de Denúncia */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Denunciar este anúncio"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className="hidden sm:inline">Denunciar</span>
                </button>
              </div>

              {isSold ? (
                <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-inner">
                  🔒 Este anúncio foi finalizado (Produto Vendido)
                </div>
              ) : ad.whatsapp ? (
                <button 
                  onClick={openWhatsApp} 
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-green-500/20 text-base cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" /> Conversar no WhatsApp
                </button>
              ) : (
                <div className="text-center text-xs text-slate-400 py-2">
                  Nenhum telefone de contato informado pelo anunciante.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE DENÚNCIA */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-black text-lg">Denunciar Anúncio</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Ajude a manter a comunidade do Fala do Bairro segura. Todas as denúncias são analisadas pela moderação.
            </p>

            {reportSent ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-center text-xs font-bold border border-emerald-200">
                ✅ Denúncia enviada com sucesso! A moderação analisará o caso.
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Motivo da Denúncia
                  </label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-red-500 outline-none cursor-pointer"
                  >
                    <option value="Anúncio suspeito ou golpe">🚨 Anúncio suspeito ou golpe</option>
                    <option value="Produto proibido ou ilegal">🚫 Produto proibido ou ilegal</option>
                    <option value="Informações falsas ou enganosas">⚠️ Informações falsas ou fotos enganosas</option>
                    <option value="Spam ou anúncio duplicado">🔁 Spam ou duplicação excessiva</option>
                    <option value="Ofensivo ou inadequado">🛑 Conteúdo ofensivo ou desrespeitoso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Detalhes Adicionais (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="Explique o que aconteceu para nos ajudar na moderação..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:border-red-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reportSending}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  {reportSending ? 'Enviando...' : 'Confirmar Denúncia'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
