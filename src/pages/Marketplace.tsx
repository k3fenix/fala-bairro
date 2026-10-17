import React, { useEffect, useState, useMemo, Component, type ReactNode } from 'react';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Repeat, RefreshCw, LogOut, Package, 
  Heart, X, PlusCircle, User as UserIcon, AlertCircle, ShoppingBag,
  Search, MapPin, SlidersHorizontal, ArrowUpDown, Sparkles
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

  const [listings, setListings] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cache_marketplace_listings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('cache_marketplace_listings');
      return !(cached && JSON.parse(cached).length > 0);
    } catch (_) {
      return true;
    }
  });
  
  // Paginação progressiva
  const [visibleCount, setVisibleCount] = useState<number>(12);

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

      if (listingsData) {
        listingsData.forEach(l => {
          if (!l) return;
          const titleKey = normalize(l.title);
          if (titleKey) seenTitles.add(titleKey);

          const cat = l.category_id ? catMapById.get(l.category_id.toString()) : null;
          const catName = cat?.name || l.category || 'Outros';

          const rawPrice = Number(l.price);
          const safePrice = isNaN(rawPrice) ? 0 : rawPrice;
          const isFree = safePrice === 0 || l.type === 'Gratis';
          const isTrade = l.accepts_trade === true || l.type === 'Troca';
          const inferredType = isTrade ? 'Troca' : (isFree ? 'Gratis' : 'Venda');

          combinedListings.push({
            id: l.id,
            title: l.title || 'Produto sem título',
            description: l.description || '',
            price: safePrice,
            condition: l.condition || 'Usado',
            category_id: l.category_id ? l.category_id.toString() : null,
            category: catName,
            accepts_trade: isTrade,
            type: inferredType,
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
          if (!item) return;
          const titleKey = normalize(item.title);
          if (titleKey && !seenTitles.has(titleKey)) {
            const rawPrice = Number(item.price);
            const safePrice = isNaN(rawPrice) ? 0 : rawPrice;
            const isFree = safePrice === 0 || item.type === 'Doação' || item.type === 'Gratis';
            const isTrade = item.type === 'Troca';

            combinedListings.push({
              id: item.id,
              title: item.title || 'Produto sem título',
              description: item.description || '',
              price: safePrice,
              condition: item.condition || 'Usado',
              category_id: null,
              category: item.category || 'Outros',
              accepts_trade: isTrade,
              type: isTrade ? 'Troca' : (isFree ? 'Gratis' : 'Venda'),
              neighborhood: item.neighborhood || 'Mário Covas',
              city: 'Campinas',
              whatsapp: item.seller_whatsapp || '',
              seller_name: item.seller_name || 'Morador do Bairro',
              image_url: item.image || '',
              status: item.status || 'Ativo',
              created_at: item.created_at || new Date().toISOString()
            });
          }
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
      
      {/* 1. CABEÇALHO PRINCIPAL DO MARKETPLACE COM A LOGO OFICIAL */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[70px] flex items-center justify-between gap-3">
          
          {/* Logo Oficial Fala do Bairro e Identidade "Venda e Troca" */}
          <Link to="/marketplace" className="flex items-center gap-3 group shrink-0" title="Fala do Bairro - Venda e Troca">
            <img 
              src="/logo-fala-bairro.svg" 
              alt="Fala do Bairro" 
              className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-102" 
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black text-slate-900 leading-none tracking-tight group-hover:text-[#ff6500] transition-colors">
                Venda e Troca
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold tracking-normal mt-0.5 hidden xs:block">
                Compre, venda e troque no seu bairro
              </span>
            </div>
          </Link>

          {/* Ações Principais: Anunciar + Entrar/Perfil */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/marketplace/anunciar"
              className="bg-[#ff6500] hover:bg-[#e95600] active:scale-98 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
              title="Criar novo anúncio"
            >
              <PlusCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Anunciar</span>
            </Link>

            {activeUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/marketplace/favoritos"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Meus Favoritos"
                >
                  <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </Link>

                <Link
                  to="/marketplace/meus-anuncios"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Meus Anúncios"
                >
                  <Package className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </Link>

                <Link
                  to="/marketplace/perfil"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-slate-200 shadow-xs cursor-pointer flex items-center justify-center bg-slate-100 hover:ring-2 hover:ring-orange-500/30 transition-all"
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
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer border border-red-200/80"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login?redirect=/marketplace"
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. ÁREA DE PESQUISA MODERNA E LOCALIZAÇÃO */}
      <section className="bg-gradient-to-b from-white to-slate-50/70 border-b border-slate-200/80 py-4 sm:py-6 shadow-2xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-stretch gap-2.5 sm:gap-3">
            
            {/* Campo de Busca Amplo */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="O que você está procurando hoje?"
                className="w-full bg-white border border-slate-200/90 hover:border-slate-300 focus:border-[#ff6500] focus:ring-2 focus:ring-orange-500/10 rounded-2xl pl-11 pr-10 py-3 sm:py-3.5 text-xs sm:text-sm text-slate-900 font-medium outline-none shadow-xs transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro por Bairro ou Localização */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <MapPin className="w-4 h-4 text-[#ff6500] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedNeighborhood}
                  onChange={e => setSelectedNeighborhood(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 hover:border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold pl-9 pr-8 py-3 sm:py-3.5 rounded-2xl outline-none cursor-pointer shadow-xs appearance-none focus:border-[#ff6500]"
                >
                  <option value="all">📍 Todos os Bairros</option>
                  {availableNeighborhoods.map(b => (
                    <option key={b} value={b}>📍 {b}</option>
                  ))}
                </select>
              </div>

              {/* Ordenação */}
              <div className="relative sm:w-48">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full bg-white border border-slate-200/90 hover:border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold px-3.5 py-3 sm:py-3.5 rounded-2xl outline-none cursor-pointer shadow-xs appearance-none focus:border-[#ff6500]"
                >
                  <option value="recent">⏱️ Mais Recentes</option>
                  <option value="price_asc">💲 Menor Preço</option>
                  <option value="price_desc">💎 Maior Preço</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FILTROS DE VENDAS, TROCAS E DOAÇÕES */}
      <section className="bg-white border-b border-slate-200/80 sticky top-[70px] z-30 shadow-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Todos os itens', icon: '📦' },
            { id: 'Venda', label: 'Vendas', icon: '💰' },
            { id: 'Troca', label: 'Trocas', icon: '🔄' },
            { id: 'Gratis', label: 'Doações', icon: '🎁' },
          ].map(tab => {
            const active = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#ff6500] text-white shadow-sm shadow-orange-500/20 scale-101'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 mt-5">
        
        {/* 4. CATEGORIAS MAIS BONITAS */}
        {categories.length > 0 && (
          <div className="mb-6 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>📦</span>
                <span>Todas as Categorias</span>
              </button>

              {categories.map(c => {
                const isSelected = activeCategory === c.id.toString();
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(isSelected ? 'all' : c.id.toString())}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#ff6500] text-white shadow-xs'
                        : 'bg-white border border-slate-200/90 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{c.icon || '🏷️'}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. TÍTULO DA SEÇÃO DE PRODUTOS & 6. QUANTIDADE DE ANÚNCIOS ENCONTRADOS */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Ofertas e Oportunidades do Bairro
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Exibindo <span className="text-[#ff6500] font-black">{displayedListings.length}</span> de <span className="font-bold text-slate-700">{filteredListings.length}</span> {filteredListings.length === 1 ? 'anúncio encontrado' : 'anúncios encontrados'}
              {typeFilter !== 'all' ? ` em ${typeFilter}` : ''}
              {selectedNeighborhood !== 'all' ? ` • ${selectedNeighborhood}` : ''}
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
              className="text-xs font-bold text-[#ff6500] hover:text-[#e95600] bg-orange-50 hover:bg-orange-100/80 px-3 py-1.5 rounded-xl border border-orange-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          )}
        </div>

        {/* 7. GRADE DE PRODUTOS (CARDS MODERNOS COM IDENTIDADE PRÓPRIA) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-3.5 animate-pulse shadow-2xs">
                <div className="aspect-square bg-slate-200/80 rounded-2xl mb-3"></div>
                <div className="h-5 bg-slate-200 rounded w-1/2 mb-2"></div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
              {displayedListings.map(ad => {
                const rawPrice = Number(ad.price);
                const isFree = isNaN(rawPrice) || rawPrice === 0 || ad.type === 'Gratis';
                const isTrade = ad.accepts_trade || ad.type === 'Troca';
                const isSold = ad.status === 'Vendido' || ad.status === 'sold';
                const formattedPrice = (!isNaN(rawPrice) && rawPrice > 0)
                  ? `R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'Grátis';

                return (
                  <div
                    key={ad.id}
                    onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)}
                    className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-3xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col relative cursor-pointer shadow-2xs"
                  >
                    {/* 1. Foto principal com boa proporção e qualidade */}
                    <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {ad.image_url ? (
                        <img
                          src={ad.image_url}
                          alt={ad.title || 'Anúncio'}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-4xl opacity-20">📦</div>
                      )}

                      {/* 2. Selos discretos: Novo / Usado */}
                      <span className="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur-md text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-white/10 shadow-xs">
                        {ad.condition || 'Usado'}
                      </span>

                      {/* 3. Selo de Troca / Doação / Vendido */}
                      {isSold ? (
                        <span className="absolute bottom-2.5 left-2.5 bg-slate-900/95 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs">
                          Vendido
                        </span>
                      ) : isTrade ? (
                        <span className="absolute bottom-2.5 left-2.5 bg-purple-600/95 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Repeat className="w-2.5 h-2.5" /> Troca
                        </span>
                      ) : isFree ? (
                        <span className="absolute bottom-2.5 left-2.5 bg-emerald-600/95 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs">
                          Doação
                        </span>
                      ) : null}
                    </div>

                    {/* Informações do Produto */}
                    <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                      
                      {/* 4. Preço em destaque */}
                      <div className="text-base sm:text-lg lg:text-xl font-black text-emerald-600 mb-1 tracking-tight leading-none">
                        {isFree ? '🎁 Doação Grátis' : formattedPrice}
                      </div>

                      {/* 5. Título legível com limite visual */}
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug mb-2 group-hover:text-[#ff6500] transition-colors">
                        {ad.title}
                      </h3>

                      {/* 6. Localização do produto & Informações complementares */}
                      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className="truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#ff6500] shrink-0" />
                          <span className="truncate">{ad.neighborhood || 'Mário Covas'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-semibold">
                          {ad.city || 'Campinas'}
                        </span>
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

      </main>

    </div>
  );
}
