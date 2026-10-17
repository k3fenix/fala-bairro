import { useEffect, useState, useMemo } from 'react';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Store, Search, Repeat, MapPin, RefreshCw, LogOut, Package, 
  Heart, Sparkles, X, UserCheck, Menu, Home, Tag, PlusCircle,
  SlidersHorizontal, ChevronDown, Check, ArrowUpDown, User
} from 'lucide-react';
import { getAuthUserSync, type UserSession } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';

export default function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const activeUser = currentUser || getAuthUserSync();
  
  // Filtros principais
  const [typeFilter, setTypeFilter] = useState<'all' | 'Venda' | 'Troca' | 'Gratis'>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');
  
  // Estado dos dados
  const [categories, setCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Paginação progressiva
  const [visibleCount, setVisibleCount] = useState<number>(12);
  
  // Menu mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Normalização de busca para remover acentos e case
  const normalize = (str: string) => {
    return (str || '')
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
    const params = new URLSearchParams(location.search);
    const tipo = params.get('tipo');
    if (tipo === 'Venda' || tipo === 'Troca' || tipo === 'Gratis') {
      setTypeFilter(tipo);
    }
  }, [location.search]);

  const loadMarketplaceData = async () => {
    setLoading(true);
    let loadedCategories: any[] = [];
    try {
      const { data: catData } = await supabase
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (catData && catData.length > 0) {
        loadedCategories = catData;
        setCategories(catData);
      }
    } catch (e) {
      console.warn("Erro ao buscar categorias:", e);
    }
    await fetchListings(loadedCategories);
  };

  const fetchListings = async (loadedCategories: any[] = categories) => {
    setLoading(true);

    const catMapById = new Map<string, any>();
    loadedCategories.forEach(c => {
      catMapById.set(c.id.toString(), c);
    });

    // 1. Buscar em marketplace_listings (oficial)
    const { data: listingsData } = await supabase
      .from('marketplace_listings')
      .select('*')
      .order('created_at', { ascending: false });
    
    // 2. Buscar em marketplace_items (legado com compatibilidade)
    const { data: itemsData } = await supabase
      .from('marketplace_items')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Buscar imagens para listings
    const imagesMap: Record<string, string> = {};
    if (listingsData && listingsData.length > 0) {
      const listingIds = listingsData.map(l => l.id);
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
      } catch (e) {}
    }

    const combinedListings: any[] = [];
    const seenTitles = new Set<string>();

    if (listingsData) {
      listingsData.forEach(l => {
        const titleKey = normalize(l.title);
        if (titleKey) seenTitles.add(titleKey);

        const cat = l.category_id ? catMapById.get(l.category_id.toString()) : null;
        const catName = cat?.name || l.category || 'Outros';

        const rawPrice = Number(l.price);
        const isFree = rawPrice === 0 || l.type === 'Gratis';
        const isTrade = l.accepts_trade === true || l.type === 'Troca';
        const inferredType = isTrade ? 'Troca' : (isFree ? 'Gratis' : 'Venda');

        combinedListings.push({
          id: l.id,
          title: l.title,
          description: l.description,
          price: rawPrice,
          condition: l.condition || 'Usado',
          category_id: l.category_id ? l.category_id.toString() : null,
          category: catName,
          accepts_trade: isTrade,
          type: inferredType,
          neighborhood: l.neighborhood || 'Mário Covas',
          city: l.city || 'Campinas',
          whatsapp: l.whatsapp,
          seller_name: l.seller_name || 'Morador do Bairro',
          image_url: imagesMap[l.id] || l.image_url || l.image || '',
          status: l.status === 'sold' ? 'Vendido' : (l.status === 'paused' ? 'Pausado' : (l.status || 'Ativo')),
          created_at: l.created_at
        });
      });
    }

    if (itemsData) {
      itemsData.forEach(item => {
        const titleKey = normalize(item.title);
        if (titleKey && !seenTitles.has(titleKey)) {
          const rawPrice = Number(item.price);
          const isFree = rawPrice === 0 || item.type === 'Doação' || item.type === 'Gratis';
          const isTrade = item.type === 'Troca';

          combinedListings.push({
            id: item.id,
            title: item.title,
            description: item.description,
            price: rawPrice,
            condition: item.condition || 'Usado',
            category_id: null,
            category: item.category || 'Outros',
            accepts_trade: isTrade,
            type: isTrade ? 'Troca' : (isFree ? 'Gratis' : 'Venda'),
            neighborhood: item.neighborhood || 'Mário Covas',
            city: 'Campinas',
            whatsapp: item.seller_whatsapp,
            seller_name: item.seller_name || 'Morador do Bairro',
            image_url: item.image || '',
            status: item.status || 'Ativo',
            created_at: item.created_at
          });
        }
      });
    }

    setListings(combinedListings);
    setLoading(false);
  };

  // Extrair lista de bairros disponíveis nos anúncios
  const availableNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    listings.forEach(l => {
      if (l.neighborhood && l.neighborhood.trim()) {
        set.add(l.neighborhood.trim());
      }
    });
    return Array.from(set).sort();
  }, [listings]);

  // Filtros combinados e ordenação
  const filteredListings = useMemo(() => {
    let result = listings.filter(item => {
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
        const selectedCatObj = categories.find(c => c.id.toString() === activeCategory);
        const matchesCatName = selectedCatObj && normalize(item.category) === normalize(selectedCatObj.name);
        if (!matchesCatId && !matchesCatName) return false;
      }

      // Filtro por Bairro
      if (selectedNeighborhood !== 'all') {
        if (normalize(item.neighborhood) !== normalize(selectedNeighborhood)) return false;
      }

      return true;
    });

    // Ordenação
    if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      // Mais recentes primeiro
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [listings, searchQuery, typeFilter, activeCategory, selectedNeighborhood, sortBy, categories]);

  const displayedListings = filteredListings.slice(0, visibleCount);
  const hasMore = visibleCount < filteredListings.length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] pb-24">
      
      {/* HEADER SUPERIOR DO MARKETPLACE */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-3">
          
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <Link to="/feed" className="w-10 h-10 rounded-xl bg-[#ff6500] text-white flex items-center justify-center font-black text-lg shadow-sm">
              FB
            </Link>
            <div className="hidden sm:block">
              <Link to="/marketplace" className="text-base font-black text-slate-900 leading-none block hover:text-[#ff6500] transition-colors">
                Marketplace
              </Link>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Classificados do Bairro
              </span>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos, móveis, ferramentas..."
              className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-[#ff6500] rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm font-medium outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Ações e Perfil */}
          <div className="flex items-center gap-2">
            <Link
              to="/marketplace/anunciar"
              className="bg-[#ff6500] hover:bg-[#e95600] text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Anunciar</span>
            </button>

            {activeUser ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/marketplace/favoritos"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Meus Favoritos"
                >
                  <Heart className="w-4 h-4" />
                </Link>

                <Link
                  to="/marketplace/meus-anuncios"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Meus Anúncios"
                >
                  <Package className="w-4 h-4" />
                </Link>

                <Link
                  to="/marketplace/perfil"
                  className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-xs cursor-pointer ml-1"
                  title="Minha Conta"
                >
                  <img
                    src={activeUser.avatar || `https://i.pravatar.cc/150?u=${activeUser.id}`}
                    alt={activeUser.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
              </div>
            ) : (
              <Link
                to="/login?redirect=/marketplace"
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-colors shrink-0"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* SUB-HEADER: ABAS DE MODALIDADE E FILTROS */}
      <div className="bg-white border-b border-slate-200/80 sticky top-[64px] z-30 shadow-xs">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          
          {/* Tabs: Todos, Venda, Troca, Doação */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'all', label: 'Todos os Itens' },
              { id: 'Venda', label: 'Venda 💰' },
              { id: 'Troca', label: 'Trocas 🔄' },
              { id: 'Gratis', label: 'Doações 🎁' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  typeFilter === tab.id
                    ? 'bg-[#ff6500] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtros de Ordenação e Bairro */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            
            {/* Filtro por Bairro */}
            {availableNeighborhoods.length > 0 && (
              <select
                value={selectedNeighborhood}
                onChange={e => setSelectedNeighborhood(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-xl outline-none cursor-pointer"
              >
                <option value="all">📍 Todos os Bairros</option>
                {availableNeighborhoods.map(b => (
                  <option key={b} value={b}>📍 {b}</option>
                ))}
              </select>
            )}

            {/* Ordenação */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-xl outline-none cursor-pointer"
            >
              <option value="recent">⏱️ Mais Recentes</option>
              <option value="price_asc">💲 Menor Preço</option>
              <option value="price_desc">💎 Maior Preço</option>
            </select>
          </div>

        </div>
      </div>

      <main className="max-w-[1250px] mx-auto px-4 sm:px-6 mt-4">
        
        {/* CARROSSEL DE CATEGORIAS */}
        {categories.length > 0 && (
          <div className="mb-6 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>📦</span>
                <span>Todas as Categorias</span>
              </button>

              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(activeCategory === c.id.toString() ? 'all' : c.id.toString())}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === c.id.toString()
                      ? 'bg-[#ff6500] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{c.icon || '🏷️'}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTADOR DE RESULTADOS */}
        <div className="flex items-center justify-between mb-4 text-xs font-bold text-slate-500">
          <span>
            Exibindo {displayedListings.length} de {filteredListings.length} produtos
            {typeFilter !== 'all' ? ` em ${typeFilter}` : ''}
          </span>

          {(activeCategory !== 'all' || typeFilter !== 'all' || selectedNeighborhood !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setActiveCategory('all');
                setTypeFilter('all');
                setSelectedNeighborhood('all');
                setSearchQuery('');
              }}
              className="text-[#ff6500] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          )}
        </div>

        {/* GRID DE ANÚNCIOS */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 animate-pulse">
                <div className="aspect-square bg-slate-200 rounded-xl mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center max-w-md mx-auto shadow-xs my-8">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Não encontramos anúncios com os filtros selecionados. Tente buscar com outros termos ou limpe os filtros.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setTypeFilter('all');
                setSelectedNeighborhood('all');
                setSearchQuery('');
              }}
              className="bg-[#ff6500] hover:bg-[#e95600] text-white px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              Ver todos os anúncios
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
              {displayedListings.map(ad => {
                const rawPrice = Number(ad.price);
                const isFree = rawPrice === 0 || ad.type === 'Gratis';
                const isTrade = ad.accepts_trade || ad.type === 'Troca';
                const isSold = ad.status === 'Vendido' || ad.status === 'sold';

                return (
                  <div
                    key={ad.id}
                    onClick={() => navigate(`/marketplace/anuncio/${ad.id}`)}
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all group flex flex-col relative cursor-pointer"
                  >
                    {/* Imagem de Capa */}
                    <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {ad.image_url ? (
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-4xl opacity-20">📦</div>
                      )}

                      {/* Selos Flutuantes */}
                      {isSold ? (
                        <span className="absolute bottom-2 left-2 bg-slate-900/95 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                          Vendido
                        </span>
                      ) : isTrade ? (
                        <span className="absolute bottom-2 left-2 bg-purple-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                          <Repeat className="w-2.5 h-2.5" /> Troca
                        </span>
                      ) : isFree ? (
                        <span className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                          Doação
                        </span>
                      ) : null}

                      {/* Estado do item */}
                      <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                        {ad.condition || 'Usado'}
                      </span>
                    </div>

                    {/* Informações do Produto */}
                    <div className="p-3.5 flex flex-col flex-1">
                      <div className="text-base sm:text-lg font-black text-emerald-600 mb-1 leading-none">
                        {isFree ? '🎁 Doação Grátis' : `R$ ${rawPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </div>

                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-tight mb-2">
                        {ad.title}
                      </h3>

                      <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate">📍 {ad.neighborhood || 'Mário Covas'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Campinas</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTÃO CARREGAR MAIS (PAGINAÇÃO PROGRESSIVA) */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-[#ff6500]" /> Carregar mais produtos ({filteredListings.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </>
        )}

      </main>

    </div>
  );
}
