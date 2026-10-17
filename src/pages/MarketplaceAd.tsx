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

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col lg:flex-row">
          
          {/* ÁREA DAS FOTOS (ESTILO FACEBOOK MARKETPLACE PREMIUM) */}
          <div className="w-full lg:w-[58%] p-4 sm:p-6 bg-slate-900 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
            {/* Foto Principal com Proporção Otimizada */}
            <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center shadow-inner group">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt={ad.title} 
                  className="w-full h-full object-contain select-none transition-transform duration-300" 
                />
              ) : (
                <div className="text-[80px] opacity-20">📦</div>
              )}

              {/* Badges Flutuantes Discretas */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                <span className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg font-black text-[11px] uppercase tracking-wider text-white shadow-sm border border-white/10">
                  {ad.condition || 'Usado'}
                </span>
                {isTrade && (
                  <span className="px-3 py-1 bg-purple-600/90 backdrop-blur-md rounded-lg font-black text-[11px] uppercase tracking-wider text-white shadow-sm flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> Aceita Troca
                  </span>
                )}
                {isSold && (
                  <span className="px-3 py-1 bg-red-600/90 backdrop-blur-md rounded-lg font-black text-[11px] uppercase tracking-wider text-white shadow-sm">
                    Vendido
                  </span>
                )}
              </div>

              {/* Contador de Fotos */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/15">
                  {selectedImageIndex + 1} / {galleryImages.length}
                </div>
              )}
            </div>

            {/* Miniaturas de foto alinhadas em carrossel */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pt-4 pb-1 no-scrollbar">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIndex === idx 
                        ? 'border-[#ff6500] ring-2 ring-orange-500/30 scale-102 shadow-md' 
                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/60'
                    }`}
                  >
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ÁREA DE INFORMAÇÕES (HIERARQUIA VISUAL EM 9 PONTOS) */}
          <div className="w-full lg:w-[42%] p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div className="space-y-6">
              
              {/* 1. CATEGORIA OU IDENTIFICAÇÃO DO ANÚNCIO */}
              <div>
                <span className="inline-block text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#ff6500] bg-orange-50 px-2.5 py-1 rounded-md mb-2">
                  {ad.category || 'Classificados do Bairro'}
                </span>
                
                {/* 2. TÍTULO DO PRODUTO (28px a 34px desktop, hierarquia limpa) */}
                <h1 className="text-2xl sm:text-[28px] lg:text-[32px] font-black text-slate-900 leading-tight tracking-tight">
                  {ad.title}
                </h1>
              </div>

              {/* 3. PREÇO EM DESTAQUE (30px a 36px, semibold/bold) */}
              {/* 4. INFORMAÇÃO DE VENDA OU TROCA */}
              <div className="py-3 border-y border-slate-100">
                {isTrade && isFree ? (
                  <div className="inline-flex items-center gap-2 text-purple-700 bg-purple-50 border border-purple-200/80 px-4 py-2 rounded-2xl font-black text-xl sm:text-2xl">
                    <Repeat className="w-6 h-6 text-purple-600" />
                    <span>Disponível para Troca</span>
                  </div>
                ) : isFree ? (
                  <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-2xl font-black text-2xl sm:text-3xl">
                    🎁 Doação Grátis
                  </div>
                ) : (
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl sm:text-[34px] lg:text-[36px] font-black text-emerald-600 tracking-tight">
                      R$ {Number(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {isTrade && (
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1">
                        <Repeat className="w-3.5 h-3.5" /> Aceita Troca
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 5. LOCALIZAÇÃO DO PRODUTO */}
              <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm sm:text-[15px]">
                <MapPin className="w-4 h-4 text-[#ff6500] shrink-0" />
                <span>Publicado em {ad.neighborhood || 'Mário Covas'}, {ad.city || 'Campinas'}</span>
              </div>

              {/* 6. DESCRIÇÃO DO ANÚNCIO (15px a 17px, leitura confortável) */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Descrição
                </h3>
                <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 text-slate-700 text-[15px] sm:text-[16px] leading-relaxed whitespace-pre-wrap">
                  {ad.description || 'O anunciante não incluiu uma descrição detalhada para este item.'}
                </div>
              </div>

              {/* 7. CARACTERÍSTICAS E ESPECIFICAÇÕES (14px a 16px) */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  Detalhes do Produto
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-[14px]">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-bold uppercase">Condição</span>
                    <strong className="text-slate-800 font-extrabold">{ad.condition || 'Usado'}</strong>
                  </div>

                  {ad.brand && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-400 block font-bold uppercase">Marca</span>
                      <strong className="text-slate-800 font-extrabold truncate block">{ad.brand}</strong>
                    </div>
                  )}

                  {ad.model && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-400 block font-bold uppercase">Modelo</span>
                      <strong className="text-slate-800 font-extrabold truncate block">{ad.model}</strong>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-bold uppercase">Modalidade</span>
                    <strong className="text-slate-800 font-extrabold">{isTrade ? 'Troca / Venda' : (isFree ? 'Doação' : 'Venda')}</strong>
                  </div>
                </div>
              </div>

              {/* 8. INFORMAÇÕES DO ANUNCIANTE (legíveis e discretas) */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {seller?.avatar_url || seller?.avatar ? (
                      <img 
                        src={seller.avatar_url || seller.avatar} 
                        alt="Anunciante" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shadow-xs" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-[#ff6500] font-black flex items-center justify-center text-lg">
                        👤
                      </div>
                    )}
                    <div>
                      <p className="font-extrabold text-slate-900 text-[15px] sm:text-base leading-snug">
                        {seller?.name || seller?.full_name || ad.seller_name || 'Morador do Bairro'}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Morador verificado • {ad.neighborhood || 'Bairro Local'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Denunciar este anúncio"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden sm:inline">Denunciar</span>
                  </button>
                </div>
              </div>

            </div>

            {/* 9. BOTÃO PRINCIPAL DE CONTATO */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              {isSold ? (
                <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base shadow-inner">
                  🔒 Este anúncio foi finalizado (Produto Vendido)
                </div>
              ) : ad.whatsapp ? (
                <button 
                  type="button"
                  onClick={openWhatsApp} 
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md shadow-green-500/20 text-base sm:text-lg cursor-pointer hover:scale-[1.01]"
                >
                  <MessageCircle className="w-6 h-6" /> Conversar no WhatsApp
                </button>
              ) : (
                <div className="text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-xl">
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
