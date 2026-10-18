import React, { useEffect, useState, useMemo, Component, type ReactNode } from 'react';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Repeat, RefreshCw, LogOut, Package, 
  Heart, X, PlusCircle, User as UserIcon, AlertCircle, ShoppingBag,
  Search, MapPin, SlidersHorizontal, ArrowUpDown, Sparkles,
  Flame, Tag, Grid, ShieldCheck, Users, TrendingUp, ChevronRight
} from 'lucide-react';
import { getAuthUserSync } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';

// Error Boundary de proteção para nunca deixar a tela em branco
class MarketplaceErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorInfo: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error?.message || 'Erro inesperado' };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Marketplace Error Boundary capturou:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
            <div className="w-14 h-14 bg-orange-100 text-[#ff6500] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Marketplace do Bairro</h2>
            <p className="text-sm text-slate-500 mb-6">
              Ocorreu uma pequena instabilidade temporária ao carregar a página.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="bg-[#ff6500] hover:bg-[#e95600] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow cursor-pointer transition-all"
              >
                Recarregar Página
              </button>
              <Link
                to="/feed"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Ir para o Início
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function MarketplaceWrapper() {
  return (
    <MarketplaceErrorBoundary>
      <MarketplaceContent />
    </MarketplaceErrorBoundary>
  );
}

function MarketplaceContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, logout } = useAuth();
  const activeUser = currentUser || getAuthUserSync();
  
  // Filtros principais
  const [typeFilter, setTypeFilter] = useState<'all' | 'Venda' | 'Troca' | 'Gratis'>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');
  
  const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Eletrônicos', icon: '📱' },
    { id: '2', name: 'Veículos & Peças', icon: '🚗' },
    { id: '3', name: 'Imóveis & Aluguel', icon: '🏠' },
    { id: '4', name: 'Móveis & Casa', icon: '🛋️' },
    { id: '5', name: 'Roupas & Moda', icon: '👗' },
    { id: '6', name: 'Serviços & Bicos', icon: '🛠️' },
    { id: '7', name: 'Infantil & Bebês', icon: '🧸' },
    { id: '8', name: 'Esportes & Lazer', icon: '⚽' },
    { id: '9', name: 'Alimentos & Doces', icon: '🍰' },
    { id: '10', name: 'Outros', icon: '📦' }
  ];

  // Estado dos dados com Cache Inicial Instantâneo (0ms de tela branca)
  const [categories, setCategories] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cache_marketplace_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_CATEGORIES;
  });

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Paginação progressiva
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Favoritos e curtidas do usuário
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [userLikedIds, setUserLikedIds] = useState<Set<string>>(new Set());
  const [commentsCountMap, setCommentsCountMap] = useState<Record<string, number>>({});

  // Normalização de busca para remover acentos e case
  const normalize = (str: any) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  useEffect(() => {
    loadUserInteractions();
  }, [activeUser]);

  const loadUserInteractions = async () => {
    // 1. Carregar favoritos do usuário
    if (activeUser?.id) {
      try {
        const { data } = await supabase
          .from('marketplace_favorites')
          .select('listing_id')
          .eq('user_id', activeUser.id);
        if (data) {
          setFavoriteIds(new Set(data.map(f => f.listing_id?.toString())));
        }
      } catch (_) {}
    }

    // 2. Carregar curtidas salvas no localStorage como fallback rápido e sincronizado
    try {
      const storedLikes = localStorage.getItem('marketplace_likes_counts');
      if (storedLikes) setLikesMap(JSON.parse(storedLikes));

      const storedUserLikes = localStorage.getItem('marketplace_user_likes');
      if (storedUserLikes) setUserLikedIds(new Set(JSON.parse(storedUserLikes)));

      const storedComments = localStorage.getItem('marketplace_comments_counts');
      if (storedComments) setCommentsCountMap(JSON.parse(storedComments));
    } catch (_) {}
  };

  const handleToggleFavoriteCard = async (e: React.MouseEvent, listingId: any) => {
    e.stopPropagation();
    if (!activeUser) {
      alert("Faça login na sua conta para salvar seus anúncios favoritos!");
      navigate(`/login?redirect=/marketplace`);
      return;
    }
    const idStr = listingId.toString();
    const isFav = favoriteIds.has(idStr);
    const updated = new Set(favoriteIds);

    if (isFav) {
      updated.delete(idStr);
      setFavoriteIds(updated);
      try {
        await supabase.from('marketplace_favorites').delete().eq('user_id', activeUser.id).eq('listing_id', listingId);
      } catch (_) {}
    } else {
      updated.add(idStr);
      setFavoriteIds(updated);
      try {
        await supabase.from('marketplace_favorites').insert({ user_id: activeUser.id, listing_id: listingId });
      } catch (_) {}
    }
  };

  const handleToggleLikeCard = (e: React.MouseEvent, listingId: any) => {
    e.stopPropagation();
    if (!activeUser) {
      alert("Faça login na sua conta para curtir anúncios!");
      navigate(`/login?redirect=/marketplace`);
      return;
    }
    const idStr = listingId.toString();
    const alreadyLiked = userLikedIds.has(idStr);
    const newLikedSet = new Set(userLikedIds);
    const currentCount = likesMap[idStr] || 0;
    const newCount = alreadyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

    if (alreadyLiked) {
      newLikedSet.delete(idStr);
    } else {
      newLikedSet.add(idStr);
    }

    const updatedLikesMap = { ...likesMap, [idStr]: newCount };
    setUserLikedIds(newLikedSet);
    setLikesMap(updatedLikesMap);

    try {
      localStorage.setItem('marketplace_likes_counts', JSON.stringify(updatedLikesMap));
      localStorage.setItem('marketplace_user_likes', JSON.stringify(Array.from(newLikedSet)));
    } catch (_) {}
  };

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  // Sincronizar parâmetros de query da URL se houver
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tipo = params.get('tipo');
      if (tipo === 'Venda' || tipo === 'Troca' || tipo === 'Gratis') {
        setTypeFilter(tipo);
      }
    } catch (_) {}
  }, [location.search]);

  const loadMarketplaceData = async () => {
    let loadedCategories = categories;
    try {
      const { data: catData } = await supabase
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (catData && catData.length > 0) {
        loadedCategories = catData;
        setCategories(catData);
        try {
          localStorage.setItem('cache_marketplace_categories', JSON.stringify(catData));
        } catch (_) {}
      }
    } catch (e) {
      console.warn("Aviso ao buscar categorias:", e);
    }
    await fetchListings(loadedCategories);
  };

  const fetchListings = async (loadedCategories: any[] = categories) => {
    const combinedListings: any[] = [];
    const seenTitles = new Set<string>();

    try {
      const catMapById = new Map<string, any>();
      (loadedCategories.length > 0 ? loadedCategories : DEFAULT_CATEGORIES).forEach(c => {
        if (c && c.id) catMapById.set(c.id.toString(), c);
      });

      // Busca paralela otimizada (Promise.all) para máxima velocidade
      const [listingsRes, itemsRes] = await Promise.all([
        supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false }),
        supabase.from('marketplace_items').select('*').order('created_at', { ascending: false })
      ]);

      const listingsData = listingsRes?.data || [];
      const itemsData = itemsRes?.data || [];

      // 3. Buscar imagens para listings
      const imagesMap: Record<string, string> = {};
      if (listingsData && listingsData.length > 0) {
        const listingIds = listingsData.map(l => l.id).filter(Boolean);
        try {
          const { data: imgs } = await supabase
            .from('marketplace_listing_images')
            .select('*')
            .in('listing_id', listingIds);
          if (imgs) {
            imgs.forEach(img => {
              if (!imagesMap[img.listing_id] || img.is_primary) {
                imagesMap[img.listing_id] = img.image_url;
              }
            });
          }
        } catch (_) {}
      }

      const seenIds = new Set<string>();

      if (listingsData) {
        listingsData.forEach(l => {
          if (!l || !l.id) return;
          const idStr = l.id.toString();
          if (seenIds.has(idStr)) return;
          seenIds.add(idStr);

          const titleKey = normalize(l.title);
          if (titleKey) seenTitles.add(titleKey);

          const cat = l.category_id ? catMapById.get(l.category_id.toString()) : null;
          const catName = cat?.name || l.category || 'Outros';

          const rawPrice = Number(l.price);
          const safePrice = isNaN(rawPrice) ? 0 : rawPrice;
          const isExplicitGratis = l.type === 'Gratis' || l.type === 'Doacao' || l.type === 'Doação';
          const isExplicitTrade = l.type === 'Troca';
          const acceptsTrade = l.accepts_trade === true || l.accepts_trade === 'sim' || isExplicitTrade;
          const resolvedType = isExplicitGratis ? 'Gratis' : (isExplicitTrade ? 'Troca' : 'Venda');

          combinedListings.push({
            id: l.id,
            title: l.title || 'Produto sem título',
            description: l.description || '',
            price: safePrice,
            condition: l.condition || 'Usado',
            category_id: l.category_id ? l.category_id.toString() : null,
            category: catName,
            accepts_trade: acceptsTrade,
            type: resolvedType,
            neighborhood: l.neighborhood || 'Mário Covas',
            city: l.city || 'Campinas',
            whatsapp: l.whatsapp || '',
            seller_name: l.seller_name || 'Morador do Bairro',
            image_url: imagesMap[l.id] || l.image_url || l.image || '',
            status: l.status === 'sold' ? 'Vendido' : (l.status === 'paused' ? 'Pausado' : (l.status || 'Ativo')),
            created_at: l.created_at || new Date().toISOString()
          });
        });
      }

      if (itemsData) {
        itemsData.forEach(item => {
          if (!item || !item.id) return;
          const idStr = item.id.toString();
          if (seenIds.has(idStr)) return;

          const titleKey = normalize(item.title);
          if (titleKey && seenTitles.has(titleKey)) return;

          seenIds.add(idStr);
          if (titleKey) seenTitles.add(titleKey);
            const rawPrice = Number(item.price);
            const safePrice = isNaN(rawPrice) ? 0 : rawPrice;
            const isExplicitGratis = item.type === 'Doação' || item.type === 'Doacao' || item.type === 'Gratis';
            const isExplicitTrade = item.type === 'Troca';
            const resolvedType = isExplicitGratis ? 'Gratis' : (isExplicitTrade ? 'Troca' : 'Venda');

            combinedListings.push({
              id: item.id,
              title: item.title || 'Produto sem título',
              description: item.description || '',
              price: safePrice,
              condition: item.condition || 'Usado',
              category_id: null,
              category: item.category || 'Outros',
              accepts_trade: isExplicitTrade || item.accepts_trade === true || item.accepts_trade === 'sim',
              type: resolvedType,
              neighborhood: item.neighborhood || 'Mário Covas',
              city: 'Campinas',
              whatsapp: item.seller_whatsapp || '',
              seller_name: item.seller_name || 'Morador do Bairro',
              image_url: item.image || '',
              status: item.status || 'Ativo',
              created_at: item.created_at || new Date().toISOString()
            });
          });
        }
      } catch (e) {
      console.error("Erro geral em fetchListings:", e);
    } finally {
      setListings(combinedListings);
      setLoading(false);
      try {
        if (combinedListings.length > 0) {
          localStorage.setItem('cache_marketplace_listings', JSON.stringify(combinedListings));
        }
      } catch (_) {}
    }
  };

  // Extrair lista de bairros disponíveis nos anúncios
  const availableNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    listings.forEach(l => {
      if (l && l.neighborhood && typeof l.neighborhood === 'string' && l.neighborhood.trim()) {
        set.add(l.neighborhood.trim());
      }
    });
    return Array.from(set).sort();
  }, [listings]);

  // Filtros combinados e ordenação
  const filteredListings = useMemo(() => {
    try {
      let result = listings.filter(item => {
        if (!item) return false;

        // Ocultar produtos pausados para o público em geral
        if (item.status === 'Pausado' || item.status === 'paused') return false;

        // Filtro de Texto (Título e Descrição)
        if (searchQuery.trim()) {
          const queryNorm = normalize(searchQuery);
          const titleNorm = normalize(item.title);
          const descNorm = normalize(item.description || '');
          if (!titleNorm.includes(queryNorm) && !descNorm.includes(queryNorm)) {
            return false;
          }
        }

        // Filtro por Modalidade (Venda, Troca, Doação)
        if (typeFilter !== 'all') {
          if (typeFilter === 'Troca' && !item.accepts_trade && item.type !== 'Troca') return false;
          if (typeFilter === 'Gratis' && item.type !== 'Gratis' && item.price !== 0) return false;
          if (typeFilter === 'Venda' && (item.price === 0 || item.type === 'Gratis')) return false;
        }

        // Filtro por Categoria
        if (activeCategory !== 'all') {
          const matchesCatId = item.category_id && item.category_id.toString() === activeCategory;
          const selectedCatObj = categories.find(c => c && c.id && c.id.toString() === activeCategory);
          const matchesCatName = selectedCatObj && normalize(item.category) === normalize(selectedCatObj.name);
          if (!matchesCatId && !matchesCatName) return false;
        }

        // Filtro por Bairro
        if (selectedNeighborhood !== 'all') {
          if (normalize(item.neighborhood) !== normalize(selectedNeighborhood)) return false;
        }

        return true;
      });

      // Cópia para ordenação sem mutação
      const sorted = [...result];

      // Ordenação segura
      if (sortBy === 'price_asc') {
        sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      } else if (sortBy === 'price_desc') {
        sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      } else {
        // Mais recentes primeiro
        sorted.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });
      }

      return sorted;
    } catch (err) {
      console.error("Erro ao filtrar anúncios:", err);
      return listings;
    }
  }, [listings, searchQuery, typeFilter, activeCategory, selectedNeighborhood, sortBy, categories]);

  const displayedListings = filteredListings.slice(0, visibleCount);
  const hasMore = visibleCount < filteredListings.length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] pb-24">
      
      {/* 1. CABEÇALHO PRINCIPAL COM A LOGO OFICIAL E TÍTULO 'FEIRA DO ROLO' */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-3">
          
          {/* Logo Oficial Fala do Bairro e Identidade "Feira do Rolo" */}
          <Link to="/marketplace" className="flex items-center gap-3.5 group shrink-0" title="Fala do Bairro - Feira do Rolo">
            <img 
              src="/logo-fala-bairro.svg" 
              alt="Fala do Bairro" 
              className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-102" 
            />
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-black text-slate-900 leading-none tracking-tight group-hover:text-[#ff6500] transition-colors flex items-center gap-1.5 font-sans">
                <span>Feira do</span>
                <span className="text-[#ff6500] italic font-serif font-black underline decoration-orange-400 decoration-2 underline-offset-4">Rolo</span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold tracking-normal mt-1 hidden xs:block">
                Compre, venda e troque no seu bairro
              </span>
            </div>
          </Link>

          {/* Ações Principais: Anunciar + Entrar/Perfil */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/marketplace/anunciar"
              className="bg-[#ff6500] hover:bg-[#e95600] active:scale-98 text-white px-4 sm:px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              title="Criar novo anúncio"
            >
              <PlusCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Anunciar</span>
            </Link>

            {activeUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/marketplace/favoritos"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Meus Favoritos"
                >
                  <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </Link>

                <Link
                  to="/marketplace/meus-anuncios"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Meus Anúncios"
                >
                  <Package className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </Link>

                <Link
                  to="/marketplace/perfil"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-slate-200 shadow-xs cursor-pointer flex items-center justify-center bg-slate-100 hover:ring-2 hover:ring-orange-500/30 transition-all"
                  title="Minha Conta"
                >
                  {activeUser.avatar ? (
                    <img
                      src={activeUser.avatar}
                      alt={activeUser.name || 'Usuário'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-slate-600" />
                  )}
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Deseja realmente sair da sua conta?')) {
                      if (logout) await logout();
                      navigate('/marketplace');
                    }
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer border border-red-200/80"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login?redirect=/marketplace"
                className="bg-[#1e293b] hover:bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 shrink-0"
              >
                <UserIcon className="w-4 h-4" />
                <span>Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. BANNER PRINCIPAL FEIRA DO ROLO — DESIGN EXATO DA REFERÊNCIA */}
      <section className="relative w-full overflow-hidden bg-slate-50 border-b border-slate-200">
        
        {/* Fundo Paisagem Oficial - Letreiro FEIRA DO ROLO rebaixado próximo à borda inferior */}
        <div 
          className="relative w-full h-[290px] sm:h-[320px] md:h-[350px] bg-cover bg-[right_75%] md:bg-[right_68%] flex flex-col justify-between"
          style={{
            backgroundImage: "url('/banner-feira-do-rolo.jpg?v=20261017f')"
          }}
        >
          {/* Conteúdo HTML Real (Títulos, Subtítulos e Botões sem textos fixos na imagem) */}
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 w-full pt-4 sm:pt-6 relative z-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] sm:text-xs font-black text-[#ff6500] uppercase tracking-wider bg-white/90 backdrop-blur-xs border border-orange-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                  <MapPin className="w-3 h-3 text-[#ff6500]" />
                  MARKETPLACE FALA DO BAIRRO
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0f172a] tracking-tight leading-[1.1]">
                O que você está <br className="hidden sm:block" />
                <span className="text-[#ff6500]">procurando</span> hoje?
              </h1>
              <p className="text-xs sm:text-sm text-slate-700 font-bold mt-1 leading-snug drop-shadow-2xs">
                Compre, venda, troque e encontre oportunidades perto de você!
              </p>
            </div>
          </div>

          {/* Barra de Filtros Funcionais (Todos os Itens, Vendas, Trocas, Doações) */}
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 w-full pb-3.5 sm:pb-4 relative z-10">
            <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'Todos os Itens', icon: <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                { id: 'Venda', label: 'Vendas', icon: <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                { id: 'Troca', label: 'Trocas', icon: <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                { id: 'Gratis', label: 'Doações', icon: <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
              ].map(tab => {
                const active = typeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTypeFilter(tab.id as any)}
                    className={`h-[36px] sm:h-[40px] px-3.5 sm:px-5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 sm:gap-2 shadow-sm ${
                      active
                        ? 'bg-[#ff6500] text-white shadow-orange-500/30 ring-2 ring-white/80'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Barra Limpa: apenas Seletores de Bairros e Ordenação */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 bg-white/95 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {/* Botão Seletor de Bairros */}
          <div className="relative bg-slate-50 hover:bg-white text-slate-800 rounded-xl border border-slate-200 shadow-xs transition-all">
            <MapPin className="w-3.5 h-3.5 text-[#ff6500] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedNeighborhood}
              onChange={e => setSelectedNeighborhood(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-bold pl-8 pr-7 py-2 outline-none cursor-pointer border-0 appearance-none"
            >
              <option value="all">📍 Todos os Bairros</option>
              {availableNeighborhoods.map(b => (
                <option key={b} value={b}>📍 {b}</option>
              ))}
            </select>
          </div>

          {/* Botão Seletor de Ordenação */}
          <div className="relative bg-slate-50 hover:bg-white text-slate-800 rounded-xl border border-slate-200 shadow-xs transition-all">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 text-xs font-bold px-3 py-2 outline-none cursor-pointer border-0 appearance-none"
            >
              <option value="recent">⏱️ Mais Recentes</option>
              <option value="price_asc">💲 Menor Preço</option>
              <option value="price_desc">💎 Maior Preço</option>
            </select>
          </div>
        </div>

      </section>

      {/* 3. BARRA DE CATEGORIAS ESTILO ÍCONES CIRCULARES (CONFORME A IMAGEM DE REFERÊNCIA) */}
      <section className="bg-white border-b border-slate-200/80 py-4 shadow-2xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-1">
            
            {/* Botão de Categorias Geral */}
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black shrink-0 transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-orange-50 text-[#ff6500] border-2 border-[#ff6500]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Grid className="w-4 h-4 text-[#ff6500]" />
              <span>Categorias</span>
            </button>

            <div className="h-6 w-px bg-slate-200 shrink-0" />

            {/* Ícones de cada Categoria */}
            {categories.map(c => {
              const isSelected = activeCategory === c.id.toString();
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(isSelected ? 'all' : c.id.toString())}
                  className={`flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer group ${
                    isSelected ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg sm:text-xl transition-all shadow-xs ${
                    isSelected
                      ? 'bg-[#ff6500] text-white ring-2 ring-orange-500/30 shadow-orange-500/20'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-orange-100 group-hover:text-[#ff6500]'
                  }`}>
                    {c.icon || '📦'}
                  </div>
                  <span className={`text-[11px] font-bold whitespace-nowrap ${
                    isSelected ? 'text-[#ff6500] font-black' : 'text-slate-600 group-hover:text-slate-900'
                  }`}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 mt-6">
        
        {/* CATÁLOGO GERAL DE PRODUTOS */}

        {/* 6. TÍTULO DO CATÁLOGO GERAL DE PRODUTOS MODERNIZADO */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff6500] animate-pulse"></span>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#ff6500]">
                Oportunidades no Bairro
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">
              Todos os Anúncios do Bairro
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 flex items-center gap-2">
              <span>Encontre oportunidades perto de você.</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-900 font-black bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                {filteredListings.length} {filteredListings.length === 1 ? 'anúncio encontrado' : 'anúncios encontrados'}
              </span>
            </p>
          </div>

          {(activeCategory !== 'all' || typeFilter !== 'all' || selectedNeighborhood !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setActiveCategory('all');
                setTypeFilter('all');
                setSelectedNeighborhood('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-[#ff6500] hover:text-[#e95600] bg-orange-50 hover:bg-orange-100 px-3.5 py-2 rounded-xl border border-orange-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          )}
        </div>

        {/* 7. GRADE DE PRODUTOS (CARDS MODERNOS COM IDENTIDADE PRÓPRIA) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-4 animate-pulse shadow-sm">
                <div className="aspect-4/3 bg-slate-200 rounded-2xl mb-3"></div>
                <div className="h-6 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-4/5 mb-3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          /* 9. ESTADOS DE AUSÊNCIA DE RESULTADOS */
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-16 text-center max-w-lg mx-auto shadow-xs my-8">
            <div className="w-16 h-16 bg-orange-50 text-[#ff6500] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-orange-100">
              🔍
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-1">Nenhum produto encontrado</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed max-w-md mx-auto">
              Não encontramos nenhum anúncio com os termos ou filtros selecionados. Tente buscar por outros termos ou explore todos os produtos do bairro.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setTypeFilter('all');
                setSelectedNeighborhood('all');
                setSearchQuery('');
              }}
              className="bg-[#ff6500] hover:bg-[#e95600] text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              Ver todos os anúncios
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
              {displayedListings.map(ad => {
                const idStr = ad.id.toString();
                const rawPrice = Number(ad.price);
                const isPriceDefined = !isNaN(rawPrice) && rawPrice > 0;
                const isPureTrade = ad.type === 'Troca';
                const isPureGratis = ad.type === 'Gratis' || ad.type === 'Doacao' || ad.type === 'Doação';
                const isTrade = isPureTrade || ad.accepts_trade === true || ad.accepts_trade === 'sim';
                const isFree = isPureGratis;
                const isSold = ad.status === 'Vendido' || ad.status === 'sold';

                const isFav = favoriteIds.has(idStr);
                const isLiked = userLikedIds.has(idStr);
                const likesCount = likesMap[idStr] || 0;
                const commentsCount = commentsCountMap[idStr] || 0;

                return (
                  <div
                    key={ad.id}
                    onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)}
                    className="bg-white border border-slate-200/90 hover:border-orange-300 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative cursor-pointer shadow-xs"
                  >
                    {/* 1. Foto principal em proporção 4:3 com destaque e moldura suave */}
                    <div className="aspect-4/3 w-full bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                      {ad.image_url ? (
                        <img
                          src={ad.image_url}
                          alt={ad.title || 'Anúncio'}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-5xl opacity-20">📦</div>
                      )}

                      {/* Selo Novo / Usado */}
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs">
                        {ad.condition || 'Usado'}
                      </span>

                      {/* Botão de Favorito Rápido */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavoriteCard(e, ad.id)}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-xs cursor-pointer ${
                          isFav 
                            ? 'bg-red-500 text-white scale-110' 
                            : 'bg-white/90 text-slate-600 hover:text-red-500 hover:bg-white hover:scale-110'
                        }`}
                        title={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Selos de Modalidade: Troca, Doação, Vendido */}
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                        {isSold ? (
                          <span className="bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-xs">
                            Vendido
                          </span>
                        ) : isPureTrade ? (
                          <span className="bg-purple-600/95 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                            <Repeat className="w-3 h-3" /> Troca
                          </span>
                        ) : isFree ? (
                          <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-xs">
                            Doação
                          </span>
                        ) : isTrade ? (
                          <span className="bg-purple-600/95 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                            <Repeat className="w-3 h-3" /> Aceita Troca
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Informações do Produto */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                      <div>
                        {/* Categoria */}
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff6500] bg-orange-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
                          {ad.category || 'Classificados'}
                        </span>

                        {/* Preço em destaque */}
                        <div className="text-xl sm:text-2xl font-black mb-1.5 tracking-tight leading-none">
                          {isPureTrade ? (
                            <span className="text-purple-700 flex items-center gap-1.5">
                              <Repeat className="w-5 h-5 inline-block text-purple-600" />
                              {isPriceDefined ? `Troca (R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : 'Troca / Permuta'}
                            </span>
                          ) : isFree ? (
                            <span className="text-emerald-600">
                              🎁 Doação Grátis
                            </span>
                          ) : (
                            <span className="text-emerald-600">
                              {isPriceDefined 
                                ? `R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                                : 'R$ A Combinar'}
                            </span>
                          )}
                        </div>

                        {/* Título legível com até 2 linhas confortáveis */}
                        <h3 className="font-bold text-[#0f172a] text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-[#ff6500] transition-colors mb-2">
                          {ad.title}
                        </h3>
                      </div>

                      <div>
                        {/* Faixa de Localização */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
                          <MapPin className="w-3.5 h-3.5 text-[#ff6500] shrink-0" />
                          <span className="truncate">{ad.neighborhood || 'Mário Covas'}, {ad.city || 'Campinas'}</span>
                        </div>

                        {/* Faixa Discreta de Interação: Curtidas e Comentários */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                          <button
                            type="button"
                            onClick={(e) => handleToggleLikeCard(e, ad.id)}
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-1.5 rounded-md ${
                              isLiked ? 'text-red-600' : 'hover:text-red-500 text-slate-500'
                            }`}
                            title="Curtir anúncio"
                          >
                            <span className="text-sm">❤️</span>
                            <span className="text-[11px] font-black">{likesCount}</span>
                          </button>

                          <div 
                            className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-600 transition-colors"
                            title="Comentários no anúncio"
                          >
                            <span className="text-sm">💬</span>
                            <span className="text-[11px] font-black">{commentsCount}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* 8. PAGINAÇÃO / CARREGAMENTO ADICIONAL */}
            {hasMore && (
              <div className="text-center mt-10 mb-4">
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold px-6 py-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-[#ff6500]" /> Carregar mais anúncios ({filteredListings.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </>
        )}

        {/* 9. RODAPÉ DE DIFERENCIAIS COMUNITÁRIOS (IDÊNTICO À IMAGEM DE REFERÊNCIA) */}
        <div className="mt-16 pt-8 border-t border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#ff6500] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">Compre e venda no seu bairro</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">Mais perto de você e da sua comunidade.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#ff6500] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">É fácil e seguro</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">Anúncios verificados pela comunidade.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#ff6500] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">Conecte-se com pessoas reais</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">Negócios entre vizinhos.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#ff6500] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">Mais economia</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">Encontre ótimas ofertas e faça bons negócios.</p>
            </div>
          </div>
        </div>

      </main>

    </div>
  );
}
