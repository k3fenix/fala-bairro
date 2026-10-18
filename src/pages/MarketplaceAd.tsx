// Force deployment v2.1.0 - Feira do Rolo
import React, { useEffect, useState, Component, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { supabase as supabaseMain } from '../lib/supabase';
import { 
  ArrowLeft, Heart, Share2, MessageCircle, AlertTriangle, 
  MapPin, Repeat, CheckCircle, PlayCircle, Edit3, ShieldAlert,
  Clock, Sparkles, X, ChevronRight, Eye, PlusCircle, ShieldCheck,
  Trash2
} from 'lucide-react';
import { getAuthUser, type UserSession } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';

// Error Boundary para garantir que a tela nunca fique em branco
class MarketplaceAdErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorInfo: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error?.message || 'Erro ao carregar detalhes' };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("MarketplaceAd Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-orange-100 text-[#ff6500] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🛍️
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Detalhes do Anúncio</h2>
          <p className="text-slate-500 text-sm max-w-sm mb-6">
            Ocorreu uma instabilidade momentânea ao processar este anúncio.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="bg-[#ff6500] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:bg-[#e95600] transition-colors cursor-pointer"
            >
              Recarregar
            </button>
            <a
              href="/marketplace"
              className="bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-300 transition-colors"
            >
              Voltar ao Marketplace
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MarketplaceAdContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  
  // Cache imediato (0ms): se o anúncio já foi listado na home ou salvo localmente, exibe na mesma hora
  const cachedInitialAd = (() => {
    if (!id) return null;
    try {
      const cached = localStorage.getItem('cache_marketplace_listings');
      if (cached) {
        const list = JSON.parse(cached);
        const found = list.find((item: any) => String(item.id) === String(id));
        if (found) return found;
      }
    } catch (_) {}
    return null;
  })();

  const [ad, setAd] = useState<any>(cachedInitialAd);
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    if (cachedInitialAd?.image_url || cachedInitialAd?.image) {
      return [cachedInitialAd.image_url || cachedInitialAd.image];
    }
    return [];
  });
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(!cachedInitialAd);
  const [seller, setSeller] = useState<any>(() => {
    if (cachedInitialAd) {
      const sellerDisplayName = cachedInitialAd.seller_name || 'Morador do Bairro';
      let photo = cachedInitialAd.seller_avatar || cachedInitialAd.avatar;
      if (photo && (photo.includes('pravatar.cc') || photo.includes('i.pravatar'))) photo = null;
      const avatarUrl = photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerDisplayName)}&background=ff6500&color=fff&bold=true`;
      return {
        name: sellerDisplayName,
        avatar: avatarUrl,
        avatar_url: avatarUrl,
        neighborhood: cachedInitialAd.neighborhood || 'Mário Covas'
      };
    }
    return null;
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(contextUser);

  // Modal de denúncia
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Anúncio suspeito ou golpe');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Zoom de imagem em tela cheia
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Interações: Curtidas & Comentários
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);

  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);

  useEffect(() => {
    // Dispara em paralelo sem travar a renderização imediata da tela
    fetchAd();
    checkUser();
    loadInteractions();
    checkAdminRole();
  }, [id]);

  const checkAdminRole = async () => {
    try {
      // 1. O usuário precisa estar autenticado no Supabase
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;

      if (!authUser) {
        setIsVerifiedAdmin(false);
        return;
      }

      // 2. Consultar se a conta no banco de dados possui perfil de admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, is_admin')
        .eq('id', authUser.id)
        .maybeSingle();

      const role = (profile?.role || '').toLowerCase();
      const isDbAdmin = profile?.is_admin === true || role === 'admin';

      // Somente é admin se a tabela profiles confirmar que este usuário tem role/is_admin
      setIsVerifiedAdmin(Boolean(isDbAdmin));
    } catch (e) {
      setIsVerifiedAdmin(false);
    }
  };

  const loadInteractions = async () => {
    if (!id) return;
    const idStr = id.toString();

    // 1. Carregar contagem de curtidas
    try {
      const storedLikes = localStorage.getItem('marketplace_likes_counts');
      if (storedLikes) {
        const parsed = JSON.parse(storedLikes);
        if (typeof parsed[idStr] === 'number') setLikesCount(parsed[idStr]);
      }
      const storedUserLikes = localStorage.getItem('marketplace_user_likes');
      if (storedUserLikes) {
        const parsed = JSON.parse(storedUserLikes);
        if (Array.isArray(parsed) && parsed.includes(idStr)) setIsLiked(true);
      }
    } catch (_) {}

    // 2. Tentar buscar comentários no banco de dados Supabase
    try {
      const { data: dbComments, error } = await supabase
        .from('marketplace_comments')
        .select('*')
        .eq('listing_id', id)
        .order('created_at', { ascending: true });

      if (!error && dbComments) {
        setComments(dbComments);
        updateCommentsCountCache(idStr, dbComments.length);
        return;
      }
    } catch (_) {}

    // Fallback sincronizado para comentários locais persistidos
    try {
      const storedLocal = localStorage.getItem(`comments_ad_${idStr}`);
      if (storedLocal) {
        const parsed = JSON.parse(storedLocal);
        setComments(parsed);
        updateCommentsCountCache(idStr, parsed.length);
      }
    } catch (_) {}
  };

  const updateCommentsCountCache = (listingId: string, count: number) => {
    try {
      const allCounts = JSON.parse(localStorage.getItem('marketplace_comments_counts') || '{}');
      allCounts[listingId] = count;
      localStorage.setItem('marketplace_comments_counts', JSON.stringify(allCounts));
    } catch (_) {}
  };

  const toggleLike = () => {
    if (!currentUser) {
      alert("Faça login na sua conta para curtir anúncios!");
      navigate(`/login?redirect=/marketplace/anuncio/${id}`);
      return;
    }
    const idStr = id ? id.toString() : '';
    const newLikedState = !isLiked;
    const newCount = newLikedState ? likesCount + 1 : Math.max(0, likesCount - 1);

    setIsLiked(newLikedState);
    setLikesCount(newCount);

    try {
      // Salvar contagem global
      const allCounts = JSON.parse(localStorage.getItem('marketplace_likes_counts') || '{}');
      allCounts[idStr] = newCount;
      localStorage.setItem('marketplace_likes_counts', JSON.stringify(allCounts));

      // Salvar curtidas do usuário
      const userLikes: string[] = JSON.parse(localStorage.getItem('marketplace_user_likes') || '[]');
      let updatedUserLikes = [...userLikes];
      if (newLikedState) {
        if (!updatedUserLikes.includes(idStr)) updatedUserLikes.push(idStr);
      } else {
        updatedUserLikes = updatedUserLikes.filter(x => x !== idStr);
      }
      localStorage.setItem('marketplace_user_likes', JSON.stringify(updatedUserLikes));
    } catch (_) {}
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!currentUser) {
      alert("Faça login na sua conta para publicar um comentário!");
      navigate(`/login?redirect=/marketplace/anuncio/${id}`);
      return;
    }

    setCommentSending(true);
    const idStr = id ? id.toString() : '';
    const commentObj = {
      id: 'cmt_' + Date.now(),
      listing_id: id,
      user_id: currentUser.id,
      user_name: currentUser.name || 'Morador do Bairro',
      user_avatar: currentUser.avatar || null,
      content: newComment.trim(),
      created_at: new Date().toISOString()
    };

    // Tentar persistir no Supabase se existir a tabela
    try {
      await supabase.from('marketplace_comments').insert([
        {
          listing_id: id,
          user_id: currentUser.id,
          user_name: currentUser.name || 'Morador do Bairro',
          user_avatar: currentUser.avatar || null,
          content: newComment.trim(),
          created_at: new Date().toISOString()
        }
      ]);
    } catch (_) {}

    // Sempre persistir no armazenamento local para exibição instantânea garantida
    const updated = [...comments, commentObj];
    setComments(updated);
    setNewComment('');
    setCommentSending(false);

    try {
      localStorage.setItem(`comments_ad_${idStr}`, JSON.stringify(updated));
      updateCommentsCountCache(idStr, updated.length);
    } catch (_) {}
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Deseja realmente excluir este comentário?")) return;
    const idStr = id ? id.toString() : '';
    try {
      await supabase.from('marketplace_comments').delete().eq('id', commentId);
    } catch (_) {}

    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    try {
      localStorage.setItem(`comments_ad_${idStr}`, JSON.stringify(updated));
      updateCommentsCountCache(idStr, updated.length);
    } catch (_) {}
  };

  const checkUser = async () => {
    const user = contextUser || (await getAuthUser());
    if (user) {
      setCurrentUser(user);
      checkFavorite(user.id);
    }
  };

  const handleMarkAsSold = async () => {
    // 1. Validar autenticação e propriedade
    const user = currentUser || (await getAuthUser());
    if (!user) {
      alert('Você precisa estar conectado à sua conta para gerenciar anúncios.');
      navigate(`/login?redirect=/marketplace/anuncio/${id}`);
      return;
    }

    const hasOwnerPermission = (ad?.user_id && user.id === ad.user_id) || 
      (user.name && ad?.seller_name && user.name.trim().toLowerCase() === ad.seller_name.trim().toLowerCase()) ||
      isVerifiedAdmin;

    if (!hasOwnerPermission) {
      alert('Acesso negado: Somente o proprietário deste anúncio pode alterar seu status.');
      return;
    }

    if (!confirm('Deseja marcar este anúncio como VENDIDO? Ele ficará visível com o selo de produto finalizado.')) return;
    
    try {
      await supabase.from('marketplace_listings').update({ status: 'sold' }).eq('id', id);
      try {
        await supabase.from('marketplace_items').update({ status: 'Vendido' }).eq('id', id);
      } catch (_) {}
      localStorage.removeItem('cache_marketplace_listings');
      fetchAd();
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleReactivate = async () => {
    // 1. Validar autenticação e propriedade
    const user = currentUser || (await getAuthUser());
    if (!user) {
      alert('Você precisa estar conectado à sua conta para gerenciar anúncios.');
      navigate(`/login?redirect=/marketplace/anuncio/${id}`);
      return;
    }

    const hasOwnerPermission = (ad?.user_id && user.id === ad.user_id) || 
      (user.name && ad?.seller_name && user.name.trim().toLowerCase() === ad.seller_name.trim().toLowerCase()) ||
      isVerifiedAdmin;

    if (!hasOwnerPermission) {
      alert('Acesso negado: Somente o proprietário deste anúncio pode reativá-lo.');
      return;
    }

    if (!confirm('Deseja reativar este anúncio no Marketplace?')) return;

    try {
      await supabase.from('marketplace_listings').update({ status: 'approved' }).eq('id', id);
      try {
        await supabase.from('marketplace_items').update({ status: 'Ativo' }).eq('id', id);
      } catch (_) {}
      localStorage.removeItem('cache_marketplace_listings');
      fetchAd();
    } catch (err: any) {
      alert('Erro ao reativar anúncio: ' + err.message);
    }
  };

  const handleOwnerDelete = async () => {
    // 1. Validar autenticação e propriedade
    const user = currentUser || (await getAuthUser());
    if (!user) {
      alert('Você precisa estar conectado à sua conta para excluir anúncios.');
      navigate(`/login?redirect=/marketplace/anuncio/${id}`);
      return;
    }

    const hasOwnerPermission = (ad?.user_id && user.id === ad.user_id) || 
      (user.name && ad?.seller_name && user.name.trim().toLowerCase() === ad.seller_name.trim().toLowerCase()) ||
      isVerifiedAdmin;

    if (!hasOwnerPermission) {
      alert('Acesso negado: Você só pode excluir os seus próprios anúncios.');
      return;
    }

    if (!confirm('⚠️ Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o seu anúncio? Esta ação não pode ser desfeita.')) return;

    try {
      try {
        await supabase.from('marketplace_listing_images').delete().eq('listing_id', id);
      } catch (_) {}
      await supabase.from('marketplace_listings').delete().eq('id', id);
      try {
        await supabase.from('marketplace_items').delete().eq('id', id);
      } catch (_) {}
      localStorage.removeItem('cache_marketplace_listings');
      alert('Seu anúncio foi excluído com sucesso!');
      navigate('/marketplace');
    } catch (err: any) {
      alert('Erro ao excluir anúncio: ' + err.message);
    }
  };

  const fetchAd = async () => {
    if (!ad) {
      setLoading(true);
    }

    try {
      // 1. Tentar buscar em marketplace_listings e galeria em paralelo
      const [listingRes, imagesRes] = await Promise.all([
        supabase.from('marketplace_listings').select('*').eq('id', id).single(),
        supabase.from('marketplace_listing_images').select('image_url, is_primary').eq('listing_id', id).order('order_index')
      ]);

      const data = listingRes.data;
      const imagesData = imagesRes.data;
      
      if (data) {
        setAd(data);
        setLoading(false); // Libera a tela imediatamente assim que o anúncio estiver pronto!

        if (imagesData && imagesData.length > 0) {
          setGalleryImages(imagesData.map(i => i.image_url));
        } else if (data.image_url || data.image) {
          setGalleryImages([data.image_url || data.image]);
        }

        // Incrementar contador de visualizações em background sem travar nada
        try {
          supabase
            .from('marketplace_listings')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', id);
        } catch (_) {}

        // Buscar informações públicas e avatar do autor da postagem (funciona para visitantes deslogados)
        let resolvedSeller: any = null;

      // 1. Tentar buscar pelo user_id em ambos os bancos (principal e marketplace)
      if (data.user_id) {
        try {
          const { data: sData } = await supabaseMain
            .from('profiles')
            .select('id, name, full_name, avatar_url, avatar, created_at, neighborhood')
            .eq('id', data.user_id)
            .maybeSingle();
          if (sData && (sData.avatar || sData.avatar_url || sData.name)) {
            resolvedSeller = sData;
          }
        } catch (_) {}

        if (!resolvedSeller) {
          try {
            const { data: sDataMkt } = await supabase
              .from('profiles')
              .select('id, name, full_name, avatar_url, avatar, created_at, neighborhood')
              .eq('id', data.user_id)
              .maybeSingle();
            if (sDataMkt && (sDataMkt.avatar || sDataMkt.avatar_url || sDataMkt.name)) {
              resolvedSeller = sDataMkt;
            }
          } catch (_) {}
        }
      }

      // 2. Se não encontrou por ID (ex: anúncio com ID antigo ou nome gravado), buscar pelo nome do autor na tabela profiles
      if ((!resolvedSeller || (!resolvedSeller.avatar && !resolvedSeller.avatar_url)) && data.seller_name) {
        const cleanName = data.seller_name.trim();
        try {
          const { data: pData } = await supabaseMain
            .from('profiles')
            .select('id, name, full_name, avatar_url, avatar, created_at, neighborhood')
            .ilike('name', `%${cleanName}%`)
            .limit(1)
            .maybeSingle();
          if (pData && (pData.avatar || pData.avatar_url)) {
            resolvedSeller = { ...resolvedSeller, ...pData };
          }
        } catch (_) {}

        if (!resolvedSeller || (!resolvedSeller.avatar && !resolvedSeller.avatar_url)) {
          try {
            const { data: pDataMkt } = await supabase
              .from('profiles')
              .select('id, name, full_name, avatar_url, avatar, created_at, neighborhood')
              .ilike('name', `%${cleanName}%`)
              .limit(1)
              .maybeSingle();
            if (pDataMkt && (pDataMkt.avatar || pDataMkt.avatar_url)) {
              resolvedSeller = { ...resolvedSeller, ...pDataMkt };
            }
          } catch (_) {}
        }
      }

      // 3. Resolver avatar final: busca foto real colocada no perfil do usuário
      const sellerDisplayName = resolvedSeller?.name || resolvedSeller?.full_name || data.seller_name || 'Morador do Bairro';
      let rawAvatar = resolvedSeller?.avatar_url || resolvedSeller?.avatar || data.seller_avatar || data.avatar;

      // Se a URL gravada for de serviços de avatar falso como pravatar.cc, descarta para não exibir pessoa estranha
      if (rawAvatar && typeof rawAvatar === 'string' && (rawAvatar.includes('pravatar.cc') || rawAvatar.includes('i.pravatar'))) {
        rawAvatar = null;
      }

      let realProfilePhoto = rawAvatar;

      // Se for o próprio anunciante navegando ou foto no cache do navegador
      if (!realProfilePhoto) {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          try {
            const parsed = JSON.parse(localUser);
            if (parsed && parsed.avatar && !parsed.avatar.includes('pravatar.cc') && (parsed.id === data.user_id || (parsed.name && parsed.name.toLowerCase() === sellerDisplayName.toLowerCase()))) {
              realProfilePhoto = parsed.avatar;
            }
          } catch (_) {}
        }
        if (!realProfilePhoto) {
          const savedAvatar = localStorage.getItem('user_avatar');
          const savedName = localStorage.getItem('user_name');
          if (savedAvatar && !savedAvatar.includes('pravatar.cc') && savedName && savedName.toLowerCase() === sellerDisplayName.toLowerCase()) {
            realProfilePhoto = savedAvatar;
          }
        }
        if (!realProfilePhoto) {
          try {
            const publicAvatarCache = JSON.parse(localStorage.getItem('public_authors_avatars') || '{}');
            if (data.user_id && publicAvatarCache[data.user_id]) {
              realProfilePhoto = publicAvatarCache[data.user_id];
            } else if (sellerDisplayName && publicAvatarCache[sellerDisplayName.toLowerCase().trim()]) {
              realProfilePhoto = publicAvatarCache[sellerDisplayName.toLowerCase().trim()];
            }
          } catch (_) {}
        }
      }

      // Se não houver foto real cadastrada ainda, gera ícone oficial com as iniciais do morador (nunca foto de terceiros/pravatar)
      const finalAvatar = realProfilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerDisplayName)}&background=ff6500&color=fff&bold=true`;

      setSeller({
        name: sellerDisplayName,
        avatar: finalAvatar,
        avatar_url: finalAvatar,
        neighborhood: resolvedSeller?.neighborhood || data.neighborhood || 'Mário Covas'
      });
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

        // Tentar obter avatar pelo seller_name
        let sellerObj: any = { name: itemData.seller_name || 'Vendedor do Bairro' };
        if (itemData.seller_name) {
          try {
            const { data: p } = await supabaseMain
              .from('profiles')
              .select('name, full_name, avatar_url, avatar')
              .ilike('name', itemData.seller_name.trim())
              .maybeSingle();
            if (p && (p.avatar || p.avatar_url)) sellerObj = { ...sellerObj, ...p };
          } catch (_) {}

          if (!sellerObj.avatar && !sellerObj.avatar_url) {
            try {
              const { data: pMkt } = await supabase
                .from('profiles')
                .select('name, full_name, avatar_url, avatar')
                .ilike('name', itemData.seller_name.trim())
                .maybeSingle();
              if (pMkt && (pMkt.avatar || pMkt.avatar_url)) sellerObj = { ...sellerObj, ...pMkt };
            } catch (_) {}
          }
        }
        const finalLegAvatar = sellerObj.avatar_url || sellerObj.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerObj.name || 'vendedor')}&background=ff6500&color=fff&bold=true`;
        sellerObj.avatar = finalLegAvatar;
        sellerObj.avatar_url = finalLegAvatar;
        setSeller(sellerObj);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
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

  // Validação estrita de propriedade do anúncio pelo ID do usuário autenticado
  const isOwner = Boolean(
    currentUser?.id && (
      (ad.user_id && String(currentUser.id) === String(ad.user_id)) ||
      (!ad.user_id && currentUser.name && ad.seller_name && currentUser.name.trim().toLowerCase() === ad.seller_name.trim().toLowerCase())
    )
  );

  // Somente Administrador com permissão confirmada no servidor/perfil
  const isAdmin = isVerifiedAdmin;

  const handleDeleteByAdmin = async () => {
    if (!isVerifiedAdmin) {
      alert('Acesso negado: Somente administradores autorizados podem excluir anúncios.');
      return;
    }
    if (!confirm('⚠️ AÇÃO DO ADMINISTRADOR:\nDeseja realmente EXCLUIR DEFINITIVAMENTE este anúncio?')) return;
    try {
      try {
        await supabase.from('marketplace_listing_images').delete().eq('listing_id', id);
      } catch (_) {}
      await supabase.from('marketplace_listings').delete().eq('id', id);
      try {
        await supabase.from('marketplace_items').delete().eq('id', id);
      } catch (_) {}
      localStorage.removeItem('cache_marketplace_listings');
      alert('Anúncio excluído com sucesso pelo Administrador!');
      navigate('/marketplace');
    } catch (err: any) {
      alert('Erro ao excluir anúncio: ' + err.message);
    }
  };

  const handleBanUserByAdmin = async () => {
    // 1. Validação estrita de segurança no servidor/banco antes de qualquer mutação
    if (!isVerifiedAdmin) {
      alert('Acesso negado: Você não possui privilégios de administrador para realizar banimentos.');
      return;
    }

    // 2. Dupla checagem ativa contra o banco de dados
    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;

      let isAuthorized = false;
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, is_admin')
          .eq('id', authUser.id)
          .maybeSingle();

        const role = (profile?.role || '').toLowerCase();
        if (profile?.is_admin === true || role === 'admin') {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        alert('Tentativa de ação não autorizada recusada pelo servidor.');
        return;
      }
    } catch (authErr) {
      alert('Falha ao autenticar permissões de administrador no servidor.');
      return;
    }

    const targetUserId = ad.user_id;
    const targetName = seller?.name || ad.seller_name || 'este usuário';
    if (!confirm(`🚨 AÇÃO DO ADMINISTRADOR:\nDeseja realmente BLOQUEAR / BANIR PARA SEMPRE o usuário "${targetName}"?\nTodos os anúncios deste usuário serão desativados.`)) return;

    try {
      if (targetUserId) {
        // Bloquear / Banir no perfil
        await supabase.from('profiles').update({ is_banned: true, banned: true, status: 'banned' }).eq('id', targetUserId);
        // Desativar todos os anúncios dele
        await supabase.from('marketplace_listings').update({ status: 'banned' }).eq('user_id', targetUserId);
      }
      // Marcar este anúncio específico como rejeitado/bloqueado
      await supabase.from('marketplace_listings').update({ status: 'rejected' }).eq('id', id);
      try {
        await supabase.from('marketplace_items').update({ status: 'Rejeitado' }).eq('id', id);
      } catch (_) {}

      // Registrar auditoria se existir tabela de logs/relatórios
      try {
        await supabase.from('marketplace_reports').insert({
          listing_id: id,
          reporter_id: currentUser?.id || 'admin',
          reason: `Usuário "${targetName}" banido pelo Administrador`,
          details: `Ação executada em ${new Date().toLocaleString('pt-BR')}`,
          status: 'resolved'
        });
      } catch (_) {}

      localStorage.removeItem('cache_marketplace_listings');
      alert(`Usuário "${targetName}" foi bloqueado e banido com sucesso!`);
      navigate('/marketplace');
    } catch (err: any) {
      alert('Erro ao bloquear usuário: ' + err.message);
    }
  };

  const isSold = ad?.status === 'sold' || ad?.status === 'Vendido';
  const isPureTrade = ad?.type === 'Troca';
  const isPureGratis = ad?.type === 'Gratis' || ad?.type === 'Doacao' || ad?.type === 'Doação';
  const rawPrice = Number(ad?.price);
  const isPriceDefined = !isNaN(rawPrice) && rawPrice > 0;
  const isTrade = isPureTrade || ad?.accepts_trade === true || ad?.accepts_trade === 'sim';
  const isFree = isPureGratis;
  const currentImage = galleryImages[selectedImageIndex] || ad?.image_url || ad?.image || '';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] pb-24">
      
      {/* HEADER NAVEGAÇÃO COM IDENTIDADE OFICIAL FEIRA DO ROLO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1280px] mx-auto h-[64px] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/marketplace')} 
              className="flex items-center gap-2 text-slate-700 font-extrabold hover:text-[#ff6500] transition-colors cursor-pointer text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <Link to="/marketplace" className="hidden sm:flex items-center gap-2 group">
              <img src="/logo-fala-bairro.svg" alt="Fala do Bairro" className="h-7 w-auto" />
              <span className="text-xs font-black text-slate-900 group-hover:text-[#ff6500] transition-colors">
                FEIRA DO <span className="text-[#ff6500]">ROLO</span>
              </span>
            </Link>
          </div>

          <div className="font-bold text-slate-800 hidden md:block truncate max-w-md text-sm">
            {ad.title}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/marketplace/anunciar"
              className="bg-[#ff6500] hover:bg-[#e95600] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Anunciar</span>
            </Link>
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

      <main className="max-w-[1280px] mx-auto p-4 sm:p-6 mt-2">
        
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

        {/* BARRA EXCLUSIVA DO ADMINISTRADOR GERAL */}
        {isAdmin && (
          <div className="mb-4 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs border bg-red-50/90 border-red-200">
            <span className="text-xs sm:text-sm font-black flex items-center gap-2 text-red-950">
              🛡️ PAINEL DO ADMINISTRADOR:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/marketplace/editar/${ad.id}`}
                className="bg-white border border-slate-300 hover:border-orange-500 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#ff6500]" /> Editar Anúncio
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

              <button 
                onClick={handleDeleteByAdmin}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Excluir este anúncio do Marketplace"
              >
                🗑️ Excluir Anúncio
              </button>

              <button 
                onClick={handleBanUserByAdmin}
                className="bg-slate-900 hover:bg-black text-amber-300 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs border border-amber-400/40"
                title="Banir usuário para sempre"
              >
                🚫 Banir Usuário
              </button>
            </div>
          </div>
        )}

        {/* BARRA DO ANUNCIANTE COMUM (NÃO-ADMIN): Apenas editar seu próprio produto */}
        {!isAdmin && isOwner && (
          <div className="mb-4 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs border bg-orange-50/90 border-orange-200">
            <span className="text-xs sm:text-sm font-black flex items-center gap-2 text-orange-950">
              ⚙️ Você é o anunciante deste produto:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/marketplace/editar/${ad.id}`}
                className="bg-white border border-slate-300 hover:border-orange-500 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#ff6500]" /> Editar Anúncio
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

              <button 
                onClick={handleOwnerDelete}
                className="bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-400 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Excluir o meu anúncio permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Anúncio
              </button>
            </div>
          </div>
        )}

        {/* MODELO 2: ESTRUTURA DE 3 COLUNAS VISUALMENTE EQUILIBRADAS NO DESKTOP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* COLUNA ESQUERDA (5 COLUNAS) — GALERIA DO PRODUTO */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col gap-3">
            {/* Foto Principal com Proporção Ampla, Moldura e Zoom */}
            <div 
              onClick={() => currentImage && setShowImageZoom(true)}
              className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 shadow-2xs flex items-center justify-center group cursor-zoom-in"
              title="Clique para ver a foto ampliada em tela cheia"
            >
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt={ad.title} 
                  className="w-full h-full object-contain select-none transition-transform duration-300 group-hover:scale-[1.02]" 
                />
              ) : (
                <div className="text-[70px] opacity-20">📦</div>
              )}

              {/* Dica visual de zoom ao passar o mouse */}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                🔍 Clique para ampliar
              </div>

              {/* Badges Flutuantes com Visual Glassmorphism Claro */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg font-black text-[10px] uppercase tracking-wider text-slate-800 shadow-xs border border-slate-200/80">
                  {ad.condition || 'Usado'}
                </span>
                {isTrade && (
                  <span className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-black text-[10px] uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> Aceita Troca
                  </span>
                )}
                {isSold && (
                  <span className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-black text-[10px] uppercase tracking-wider shadow-xs">
                    Vendido
                  </span>
                )}
              </div>

              {/* Contador de Fotos */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-xs">
                  {selectedImageIndex + 1} / {galleryImages.length}
                </div>
              )}
            </div>

            {/* Miniaturas de foto alinhadas em carrossel elegante */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                      selectedImageIndex === idx 
                        ? 'border-[#ff6500] ring-2 ring-orange-500/30 scale-102 shadow-sm' 
                        : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                    }`}
                  >
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUNA CENTRAL (4 COLUNAS) — INFORMAÇÕES DETALHADAS DO PRODUTO */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-5">
            <div>
              {/* Categoria */}
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#ff6500] bg-orange-50 px-2.5 py-1 rounded-md mb-2">
                {ad.category || 'Classificados do Bairro'}
              </span>
              
              {/* Título do Produto */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight mb-3">
                {ad.title}
              </h1>

              {/* Preço em Destaque */}
              <div className="py-2.5 mb-4 border-y border-slate-100">
                {isPureTrade ? (
                  <div className="inline-flex items-center gap-2 text-purple-700 bg-purple-50 border border-purple-200/80 px-3.5 py-1.5 rounded-xl font-black text-lg sm:text-xl">
                    <Repeat className="w-5 h-5 text-purple-600" />
                    <span>{isPriceDefined ? `Troca (Avaliado em R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : 'Disponível para Troca / Permuta'}</span>
                  </div>
                ) : isFree ? (
                  <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl font-black text-2xl">
                    🎁 Doação Grátis
                  </div>
                ) : (
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                      {isPriceDefined 
                        ? `R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : 'R$ A Combinar'}
                    </span>
                    {isTrade && (
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 flex items-center gap-1">
                        <Repeat className="w-3 h-3" /> Aceita Troca
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Localização do Anúncio */}
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs sm:text-sm mb-4">
                <MapPin className="w-4 h-4 text-[#ff6500] shrink-0" />
                <span>{ad.neighborhood || 'Mário Covas'}, {ad.city || 'Campinas'}</span>
              </div>

              {/* Descrição do Anúncio */}
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Descrição
                </h3>
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {ad.description || 'O anunciante não incluiu uma descrição detalhada para este item.'}
                </div>
              </div>

              {/* Características e Detalhes do Produto */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Detalhes do Produto
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Condição</span>
                    <strong className="text-slate-800 font-extrabold">{ad.condition || 'Usado'}</strong>
                  </div>

                  {ad.brand && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Marca</span>
                      <strong className="text-slate-800 font-extrabold truncate block">{ad.brand}</strong>
                    </div>
                  )}

                  {ad.model && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Modelo</span>
                      <strong className="text-slate-800 font-extrabold truncate block">{ad.model}</strong>
                    </div>
                  )}

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Modalidade</span>
                    <strong className="text-slate-800 font-extrabold">{isPureTrade ? 'Troca / Permuta' : (isFree ? 'Doação Grátis' : (isTrade ? 'Venda (Aceita Troca)' : 'Venda'))}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (3 COLUNAS) — CONTATO, ANUNCIANTE E DICAS DE SEGURANÇA */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* Card de Contato Direto e Vendedor */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                {seller?.avatar_url || seller?.avatar ? (
                  <img 
                    src={seller.avatar_url || seller.avatar} 
                    alt="Anunciante" 
                    onError={(e: any) => {
                      const name = seller?.name || ad.seller_name || 'Morador';
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6500&color=fff&bold=true`;
                    }}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shadow-xs" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-[#ff6500] font-black flex items-center justify-center text-lg shrink-0">
                    👤
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug truncate">
                    {seller?.name || seller?.full_name || ad.seller_name || 'Morador do Bairro'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    Morador do Bairro • {ad.neighborhood || 'Local'}
                  </p>
                </div>
              </div>

              {/* Botão Principal WhatsApp */}
              {isSold ? (
                <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-inner text-center">
                  🔒 Este produto foi vendido
                </div>
              ) : ad.whatsapp ? (
                <button 
                  type="button"
                  onClick={openWhatsApp} 
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-green-500/20 text-sm sm:text-base cursor-pointer hover:scale-[1.02]"
                >
                  <MessageCircle className="w-5 h-5" /> Conversar no WhatsApp
                </button>
              ) : (
                <div className="text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-xl">
                  Telefone não divulgado
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="mt-3 text-slate-400 hover:text-red-500 transition-colors text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer py-1"
                title="Denunciar este anúncio"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Denunciar Anúncio</span>
              </button>
            </div>

            {/* Card de Dicas de Segurança e Negociação Local */}
            <div className="bg-sky-50/70 border border-sky-100 rounded-3xl p-4 sm:p-5 text-slate-700 shadow-2xs">
              <div className="flex items-center gap-2 text-sky-900 font-black text-xs uppercase tracking-wider mb-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Dicas de Segurança</span>
              </div>
              <ul className="text-[11px] sm:text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-600 font-bold">•</span>
                  <span>Prefira negociar em locais públicos e movimentados do bairro.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-600 font-bold">•</span>
                  <span>Confira o estado do produto antes de efetuar o pagamento.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-sky-600 font-bold">•</span>
                  <span>Negócio direto entre vizinhos fortalece a comunidade!</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* 10. BARRA DE INTERAÇÕES SOCIAIS: CURTIR, FAVORITAR, COMENTAR, COMPARTILHAR */}
        <div className="mt-5 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Botão Curtir com coração animado */}
            <button
              type="button"
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-xs border ${
                isLiked
                  ? 'bg-red-50 text-red-600 border-red-200 ring-2 ring-red-400/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span className="text-base sm:text-lg">❤️</span>
              <span>{isLiked ? 'Curtido' : 'Curtir'}</span>
              <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-black ml-1 text-slate-900 border border-slate-200">
                {likesCount}
              </span>
            </button>

            {/* Botão Favoritar / Salvar */}
            <button
              type="button"
              onClick={toggleFavorite}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-xs border ${
                isFavorite
                  ? 'bg-orange-50 text-[#ff6500] border-orange-200 ring-2 ring-orange-400/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#ff6500] text-[#ff6500]' : 'text-slate-600'}`} />
              <span>{isFavorite ? 'Salvo nos Favoritos' : 'Favoritar'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('marketplace-comments-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="text-sm">💬</span>
              <span>{comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>

        {/* 11. SISTEMA COMPLETO DE COMENTÁRIOS E DÚVIDAS */}
        <div id="marketplace-comments-section" className="mt-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0f172a] tracking-tight flex items-center gap-2">
                <span>Perguntas e Comentários</span>
                <span className="bg-orange-100 text-[#ff6500] text-xs font-black px-2.5 py-0.5 rounded-full">
                  {comments.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Tire dúvidas sobre o produto diretamente com o vendedor e vizinhos
              </p>
            </div>
          </div>

          {/* Formulário de Envio de Comentário */}
          <form onSubmit={handleAddComment} className="mb-8">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Seu avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-[#ff6500]">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : '👤'}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva uma pergunta ou comentário sobre este anúncio..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#ff6500] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none"
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Seja respeitoso e siga as regras do bairro
                  </span>

                  <button
                    type="submit"
                    disabled={commentSending || !newComment.trim()}
                    className="bg-[#ff6500] hover:bg-[#e95600] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-102 flex items-center gap-1.5"
                  >
                    <span>{commentSending ? 'Enviando...' : 'Publicar Pergunta'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Lista de Comentários */}
          {comments.length === 0 ? (
            <div className="bg-slate-50/80 rounded-2xl p-8 text-center border border-dashed border-slate-200">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm font-bold text-slate-700 mb-1">Nenhuma pergunta ainda</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Seja o primeiro a perguntar sobre o estado do produto, valor, formas de entrega ou troca!
              </p>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-slate-100">
              {comments.map((cmt) => {
                const isAuthor = currentUser && currentUser.id === cmt.user_id;
                const isAdminUser = isVerifiedAdmin;

                return (
                  <div key={cmt.id} className="pt-4 first:pt-0 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                      {cmt.user_avatar ? (
                        <img src={cmt.user_avatar} alt={cmt.user_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-slate-600">
                          {cmt.user_name ? cmt.user_name.charAt(0).toUpperCase() : '👤'}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {cmt.user_name || 'Vizinho'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {cmt.created_at ? new Date(cmt.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                          </span>
                        </div>

                        {(isAuthor || isAdminUser) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(cmt.id)}
                            className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Excluir este comentário"
                          >
                            Excluir
                          </button>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        {cmt.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE ZOOM DE IMAGEM AMPLIADA */}
      {showImageZoom && currentImage && (
        <div 
          onClick={() => setShowImageZoom(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white text-white hover:text-black w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={currentImage}
              alt={ad.title}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

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

export default function MarketplaceAd() {
  return (
    <MarketplaceAdErrorBoundary>
      <MarketplaceAdContent />
    </MarketplaceAdErrorBoundary>
  );
}
