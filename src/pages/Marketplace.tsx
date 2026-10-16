import { useEffect, useState } from 'react';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Search, Repeat, MapPin, RefreshCw, LogOut, Package, Heart, Sparkles, X, UserCheck, Menu, Home, Tag, PlusCircle } from 'lucide-react';
import { getAuthUserSync } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';

export default function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const activeUser = currentUser || getAuthUserSync();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRedirectTarget, setAuthRedirectTarget] = useState<string>('/marketplace');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Venda' | 'Troca' | 'Gratis'>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tradeOnlyFilter, setTradeOnlyFilter] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Normalização de textos para busca sem falhas por acentos ou caixa alta
  const normalize = (str: string) => {
    return (str || '')
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  useEffect(() => {
    checkMarketplaceStatus();
    loadMarketplaceData();
  }, []);

  // Revalidar anúncios ao trocar parâmetros de busca ou após publicar novo anúncio
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tipo = params.get('tipo');
    if (tipo === 'Venda' || tipo === 'Troca' || tipo === 'Gratis') {
      setTypeFilter(tipo);
    }
    loadMarketplaceData();
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
    const catMapByName = new Map<string, any>();
    loadedCategories.forEach(c => {
      catMapById.set(c.id.toString(), c);
      catMapByName.set(normalize(c.name), c);
    });

    // 1. Tentar buscar em marketplace_listings (tabela oficial)
    const { data: listingsData } = await supabase
      .from('marketplace_listings')
      .select('*')
      .order('created_at', { ascending: false });
    
    // 2. Tentar buscar em marketplace_items (compatibilidade total e retroativa)
    const { data: itemsData } = await supabase
      .from('marketplace_items')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Buscar imagens para listings se houver
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
        const isFree = rawPrice === 0;
        const isTrade = l.accepts_trade === true;
        const inferredType = isTrade ? 'Troca' : (isFree ? 'Grátis' : 'Venda');

        combinedListings.push({
          id: l.id,
          title: l.title,
          description: l.description,
          price: l.price,
          condition: l.condition || 'Usado',
          category_id: l.category_id ? l.category_id.toString() : null,
          category: catName,
          accepts_trade: isTrade,
          type: inferredType,
          neighborhood: l.neighborhood || 'Bairro Local',
          city: l.city || 'Campinas',
          whatsapp: l.whatsapp,
          seller_name: l.seller_name || 'Morador do Bairro',
          image_url: imagesMap[l.id] || l.image_url || l.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
          image: imagesMap[l.id] || l.image_url || l.image,
          status: l.status === 'sold' ? 'Vendido' : (l.status === 'paused' ? 'Pausado' : (l.status || 'Ativo')),
          created_at: l.created_at
        });
      });
    }

    if (itemsData) {
      itemsData.forEach(item => {
        const titleKey = normalize(item.title);
        if (!seenTitles.has(titleKey)) {
          if (titleKey) seenTitles.add(titleKey);

          let catId: string | null = null;
          let catName = item.category || 'Outros';

          if (item.category) {
            const foundCat = catMapByName.get(normalize(item.category));
            if (foundCat) {
              catId = foundCat.id.toString();
              catName = foundCat.name;
            }
          }

          const rawPrice = Number(item.price);
          const isFree = item.type === 'Grátis' || item.type === 'Gratis' || item.type === 'Grátis/Doação' || rawPrice === 0;
          const isTrade = item.type === 'Troca' || item.type === 'Trocas' || item.accepts_trade === true;
          const inferredType = isTrade ? 'Troca' : (isFree ? 'Grátis' : (item.type || 'Venda'));

          combinedListings.push({
            id: item.id,
            title: item.title,
            description: item.description,
            price: item.price,
            condition: item.condition || 'Usado',
            category_id: catId,
            category: catName,
            accepts_trade: isTrade,
            type: inferredType,
            neighborhood: item.neighborhood || 'Bairro Local',
            city: 'Campinas',
            whatsapp: item.seller_whatsapp || item.whatsapp,
            seller_name: item.seller_name || 'Morador do Bairro',
            image_url: item.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
            image: item.image,
            status: item.status || 'Ativo',
            created_at: item.created_at
          });
        }
      });
    }

    setListings(combinedListings);
    setLoading(false);
  };

  const checkMarketplaceStatus = async () => {
    try {
      const { data } = await supabase.from('marketplace_settings').select('*').eq('key', 'marketplace_enabled').single();
      if (data && data.value === 'true') {
        setIsEnabled(true);
      } else {
        setIsEnabled(true);
      }
    } catch (e) {
      setIsEnabled(true);
    }
  };

  // Filtragem base (categoria, busca, tipo, status)
  const baseFiltered = listings.filter(item => {
    // 1. Categoria
    let matchesCategory = true;
    if (activeCategory !== 'all') {
      const selectedCat = categories.find(c => c.id.toString() === activeCategory);
      const selectedCatNorm = selectedCat ? normalize(selectedCat.name) : '';
      const itemCatId = item.category_id?.toString();
      const itemCatNorm = normalize(item.category || '');

      matchesCategory = Boolean(
        (itemCatId && itemCatId === activeCategory) ||
        (selectedCatNorm && itemCatNorm && (itemCatNorm.includes(selectedCatNorm) || selectedCatNorm.includes(itemCatNorm)))
      );
    }

    // 2. Busca com normalização de acentos e termos
    const q = normalize(searchQuery);
    const matchesSearch = !q || 
      normalize(item.title).includes(q) || 
      normalize(item.description).includes(q) ||
      normalize(item.neighborhood).includes(q) ||
      normalize(item.city).includes(q) ||
      normalize(item.category).includes(q) ||
      normalize(item.seller_name).includes(q);

    // 3. Aceita troca
    const matchesTrade = !tradeOnlyFilter || item.accepts_trade === true || item.type === 'Troca';

    // 4. Tipo de anúncio (TODOS / VENDAS / TROCAS / GRÁTIS)
    let matchesType = true;
    const priceNum = Number(String(item.price || '').replace(',', '.'));
    const isFree = item.type === 'Grátis' || item.type === 'Gratis' || item.type === 'Grátis/Doação' || (!isNaN(priceNum) && priceNum === 0);
    const isTrade = item.accepts_trade === true || item.type === 'Troca';

    if (typeFilter === 'Venda') {
      matchesType = !isFree && (item.type === 'Venda' || (!isNaN(priceNum) && priceNum > 0) || !item.type);
    } else if (typeFilter === 'Troca') {
      matchesType = isTrade;
    } else if (typeFilter === 'Gratis') {
      matchesType = isFree;
    }

    const isNotPaused = item.status !== 'paused' && item.status !== 'Pausado' && item.status !== 'recusado';
    return matchesCategory && matchesSearch && matchesTrade && matchesType && isNotPaused;
  });

  // Filtro geográfico inteligente com fallback para a Cidade
  let filteredListings = baseFiltered;
  let isLocationFallback = false;

  if (selectedLocation !== 'all') {
    const locNorm = normalize(selectedLocation);
    const neighborhoodMatches = baseFiltered.filter(item => 
      normalize(item.neighborhood).includes(locNorm) || locNorm.includes(normalize(item.neighborhood))
    );

    if (neighborhoodMatches.length > 0) {
      filteredListings = neighborhoodMatches;
    } else {
      // Fallback: se o bairro específico não tem itens ainda, mostra os anúncios de Campinas e região
      isLocationFallback = true;
      filteredListings = baseFiltered;
    }
  }

  const handleProtectedSellClick = () => {
    if (!activeUser) {
      setAuthRedirectTarget('/marketplace/anunciar');
      setShowAuthModal(true);
      return;
    }
    navigate('/marketplace/anunciar');
  };

  const handleProtectedAction = (path: string) => {
    if (!activeUser) {
      setAuthRedirectTarget(path);
      setShowAuthModal(true);
      return;
    }
    navigate(path);
  };


  if (isEnabled === null) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Carregando Marketplace...</div>;
  }

  if (isEnabled === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Store className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Marketplace Indisponível</h1>
        <p className="text-slate-500 mb-6 text-center max-w-md">O FALA DO BAIRRO MARKETPLACE está temporariamente em manutenção.</p>
        <button onClick={() => navigate('/feed')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md">
          Voltar para a Comunidade
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2433] pb-16">
      {/* HEADER MARKETPLACE */}
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-50 shadow-xs">
        <div className="max-w-[1250px] mx-auto min-h-[64px] flex items-center justify-between gap-3 px-4 py-2 flex-wrap sm:flex-nowrap">
          
          {/* LOGO OFICIAL FALA DO BAIRRO COM 3D CARTOON HOUSE */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => navigate('/')}>
            <img src="/logo-fala-bairro.svg" alt="Fala do Bairro" className="h-10 sm:h-11 w-auto object-contain drop-shadow-sm" />
            <div>
              <strong className="block text-base sm:text-lg font-black text-[#202636] leading-none mb-0.5">FALA DO BAIRRO</strong>
              <span className="block text-[#ff6500] text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">MARKETPLACE</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/'); }}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer ml-1.5 transition-colors"
              title="Voltar para a página principal do Fala do Bairro"
            >
              ⬅️ Portal
            </button>
          </div>

          {/* BARRA DE PESQUISA COMPACTA */}
          <div className="flex-1 relative order-3 sm:order-none w-full sm:w-auto max-w-xl mx-auto">
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos, roupas, eletrônicos..." 
              className="w-full h-10 sm:h-11 border border-slate-200 rounded-full pl-4 pr-11 outline-none bg-slate-50 focus:border-[#ff6500] focus:bg-white text-xs sm:text-sm font-medium transition-all"
            />
            <button className="absolute right-1 top-1 h-8 sm:h-9 w-9 border-0 rounded-full bg-[#ff6500] hover:bg-[#e95600] text-white flex items-center justify-center text-sm cursor-pointer shadow-xs transition-colors">
              🔍
            </button>
          </div>

          {/* BOTÕES DE USUÁRIO / ATALHOS / HAMBURGUER RESPONSIVOS */}
          <div className="flex items-center gap-2 order-2 sm:order-none shrink-0 ml-auto sm:ml-0">
            {/* Botão + Publicar anúncio em destaque */}
            <button 
              onClick={handleProtectedSellClick} 
              className="border-0 bg-gradient-to-r from-[#ff7a00] to-[#ff5100] hover:opacity-95 text-white font-black px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full cursor-pointer shadow-sm shadow-orange-500/20 whitespace-nowrap text-xs sm:text-sm flex items-center gap-1"
            >
              <span>+</span> <span>Anunciar</span>
            </button>

            {/* Perfil Compacto (se logado) */}
            {activeUser ? (
              <div 
                onClick={() => navigate('/feed')}
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 sm:px-2.5 sm:py-1 rounded-full shadow-xs cursor-pointer hover:bg-slate-100 transition-colors"
                title="Meu Perfil"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-[#ff6500] shrink-0 border border-orange-200">
                  {activeUser.avatar ? (
                    <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{activeUser.name?.charAt(0)}</span>
                  )}
                </div>
                <span className="hidden sm:inline-block text-xs font-bold text-slate-800 max-w-[80px] truncate">{activeUser.name?.split(' ')[0]}</span>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthRedirectTarget('/marketplace'); setShowAuthModal(true); }}
                className="border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-full text-slate-700 font-bold text-xs cursor-pointer"
              >
                Entrar
              </button>
            )}

            {/* BOTÃO DO MENU GAVETA NO LADO DIREITO */}
            <button 
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm shadow-orange-500/20 active:scale-95"
              title="Abrir Menu do Marketplace"
              aria-label="Abrir Menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          DRAWER LATERAL DO MARKETPLACE NO LADO DIREITO
          ========================================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-[300px] sm:w-[340px] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Topo do Menu com Logo Oficial e Fechar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-orange-500/10 to-amber-500/5">
              <div className="flex items-center gap-2">
                <img src="/logo-fala-bairro.svg" alt="Fala do Bairro" className="w-9 h-9 object-contain" />
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">Fala do Bairro</h3>
                  <span className="text-[10px] font-extrabold text-[#ff6500] uppercase tracking-wider block">Marketplace Local</span>
                </div>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Perfil no Menu */}
            {activeUser ? (
              <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#ff6500] to-amber-400 shrink-0 overflow-hidden shadow-xs">
                    <img src={activeUser.avatar || `https://i.pravatar.cc/150?u=${activeUser.name}`} alt={activeUser.name} className="w-full h-full object-cover rounded-full bg-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-slate-900 truncate">{activeUser.name}</h4>
                    <p className="text-xs text-[#ff6500] font-bold">{activeUser.neighborhood || 'Morador'}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Links do Menu */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2">
                Marketplace
              </div>

              <button 
                onClick={() => { handleProtectedSellClick(); setDrawerOpen(false); }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold bg-orange-50 text-[#ff6500] border border-orange-200/80 cursor-pointer text-left"
              >
                <span className="flex items-center gap-3">
                  <PlusCircle className="w-5 h-5 text-[#ff6500]" />
                  <span>Publicar Novo Anúncio</span>
                </span>
                <span className="text-xs font-black text-white bg-[#ff6500] px-2 py-0.5 rounded-full">Grátis</span>
              </button>

              <button 
                onClick={() => { handleProtectedAction('/marketplace/meus-anuncios'); setDrawerOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
              >
                <Package className="w-5 h-5 text-orange-500" />
                <span>Meus Anúncios Publicados</span>
              </button>

              <button 
                onClick={() => { handleProtectedAction('/marketplace/favoritos'); setDrawerOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
              >
                <Heart className="w-5 h-5 text-rose-500" />
                <span>Itens Favoritos</span>
              </button>

              <div className="pt-4 border-t border-slate-100 mt-4 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2">
                Portal Fala do Bairro
              </div>

              <button 
                onClick={() => { navigate('/feed'); setDrawerOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer text-left"
              >
                <Home className="w-5 h-5 text-blue-600" />
                <span>Ir para o Feed / Mural</span>
              </button>

              <button 
                onClick={() => { navigate('/'); setDrawerOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
              >
                <Store className="w-5 h-5 text-slate-500" />
                <span>Página Inicial do Portal</span>
              </button>
            </div>

            {/* Rodapé Logout */}
            {activeUser && (
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => { setDrawerOpen(false); logout(); }}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-200/80"
                >
                  <LogOut className="w-4 h-4" /> Sair da Conta
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HERO BANNER - COMPACTO E ELEGANTE (FAIXA LARANJA DIMINUÍDA) */}
      <section className="bg-gradient-to-r from-[#ff6500] via-[#ff5100] to-[#ea580c] text-white overflow-hidden relative shadow-inner">
        <div className="max-w-[1250px] mx-auto py-5 sm:py-7 px-4 flex items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-2 border border-white/25">
              <Sparkles className="w-3 h-3 text-amber-200" /> Classificados de Confiança
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight text-white mb-1">
              Compre, Venda e Troque no Seu Bairro
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 font-medium max-w-xl">
              Classificados locais de pessoas reais da sua vizinhança. Desapegue com facilidade e segurança.
            </p>
          </div>
          <div className="hidden sm:flex w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/15 border border-white/20 items-center justify-center text-4xl shrink-0 shadow-inner">
            🛍️
          </div>
        </div>
      </section>

      <main className="max-w-[1250px] mx-auto p-[24px_20px]">
        {/* TABS DE TIPO: TODOS / VENDAS / TROCAS / GRÁTIS */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setTypeFilter('all')} 
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${typeFilter === 'all' ? 'bg-[#ff6500] text-white shadow-lg shadow-orange-500/25 scale-105' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'}`}
          >
            🌟 TODOS
          </button>
          <button 
            onClick={() => setTypeFilter('Venda')} 
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${typeFilter === 'Venda' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'}`}
          >
            🏷️ VENDAS
          </button>
          <button 
            onClick={() => setTypeFilter('Troca')} 
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${typeFilter === 'Troca' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 scale-105' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'}`}
          >
            🔄 TROCAS
          </button>
          <button 
            onClick={() => setTypeFilter('Gratis')} 
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${typeFilter === 'Gratis' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-105' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'}`}
          >
            🎁 GRÁTIS / DOAÇÃO
          </button>

          {/* FILTRO DE LOCALIZAÇÃO GEOGRÁFICA */}
          <div className="ml-auto shrink-0 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-2xl shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#ff6500]" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">📍 Toda a Região (Campinas)</option>
              {currentUser?.neighborhood && (
                <option value={currentUser.neighborhood}>🏡 Meu Bairro: {currentUser.neighborhood}</option>
              )}
              <option value="Mário Covas">Mário Covas</option>
              <option value="Vila Rica">Vila Rica</option>
              <option value="Centro">Centro</option>
              <option value="Jardim Botânico">Jardim Botânico</option>
            </select>
          </div>
        </div>

        {/* CATEGORIAS */}
        <div className="mb-[28px]">
          <div className="flex justify-between items-center mb-[14px]">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1d2433]">Explorar Categorias</h2>
            <button 
              onClick={() => setTradeOnlyFilter(!tradeOnlyFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${tradeOnlyFilter ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'}`}
            >
              <Repeat className="w-3.5 h-3.5" />
              {tradeOnlyFilter ? 'Mostrando Aceitam Troca' : 'Filtrar Aceita Troca'}
            </button>
          </div>

          <div className="flex gap-[12px] overflow-x-auto pb-[10px] snap-x no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            <button 
              onClick={() => setActiveCategory('all')}
              className={`snap-start shrink-0 flex flex-col items-center justify-center w-[85px] sm:w-[90px] h-[85px] sm:h-[90px] rounded-[18px] border transition-all cursor-pointer ${activeCategory === 'all' ? 'border-[#ff6500] bg-[#fff5ef] text-[#ff6500] font-black' : 'border-[#e7e7e7] bg-white hover:border-[#ccc]'}`}
            >
              <div className="text-[24px] sm:text-[26px] mb-[4px]">🌟</div>
              <span className="text-[11px] sm:text-[12px] font-bold">Todos</span>
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`snap-start shrink-0 flex flex-col items-center justify-center w-[85px] sm:w-[90px] h-[85px] sm:h-[90px] rounded-[18px] border transition-all cursor-pointer ${activeCategory === cat.id.toString() ? 'border-[#ff6500] bg-[#fff5ef] text-[#ff6500] font-black' : 'border-[#e7e7e7] bg-white hover:border-[#ccc]'}`}
              >
                <div className="text-[24px] sm:text-[26px] mb-[4px]">{cat.icon}</div>
                <span className="text-[11px] sm:text-[12px] font-bold text-center leading-tight px-1">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICAÇÃO DE FALLBACK GEOGRÁFICO INTELIGENTE */}
        {isLocationFallback && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3 text-amber-900 shadow-sm animate-fade-in">
            <span className="text-2xl shrink-0">📍</span>
            <div className="text-xs sm:text-sm">
              <strong>Aviso amigável:</strong> Ainda não há produtos anunciados exclusivamente no bairro <strong>"{selectedLocation}"</strong>. Para você não ficar sem opções, estamos exibindo os <strong>{filteredListings.length} produtos mais recentes de toda a cidade de Campinas e região</strong>:
            </div>
          </div>
        )}

        {/* LISTINGS HEADER */}
        <div className="mb-[18px] flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-[20px] sm:text-[22px] font-bold text-[#1d2433]">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Produtos do Bairro'}
          </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => loadMarketplaceData()} 
              className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="Recarregar produtos"
            >
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
            <span className="text-xs text-slate-500 font-semibold">{filteredListings.length} produtos encontrados</span>
          </div>
        </div>


        {loading ? (
          <div className="text-center py-16 text-slate-500 font-medium">Carregando produtos do Marketplace...</div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm mt-4">
             <Store className="w-16 h-16 mx-auto mb-4 text-slate-300" />
             <p className="text-xl font-bold text-slate-800 mb-2">Nenhum anúncio encontrado.</p>
             <p className="text-slate-500 mb-6">Tente pesquisar por outro termo ou seja o primeiro a publicar nesta categoria!</p>
             <button onClick={handleProtectedSellClick} className="bg-[#ff6500] hover:bg-[#e95600] text-white px-6 py-3 rounded-2xl font-bold shadow-md cursor-pointer transition-colors">
               + Anunciar Meu Produto
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[18px]">
            {filteredListings.map(item => {
              const imageSrc = item.image_url || item.image;
              return (
                <div 
                  key={item.id} 
                  className="bg-white border border-[#e7e7e7] rounded-[18px] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col cursor-pointer" 
                  onClick={() => navigate(`/marketplace/anuncio/${item.id}`)}
                >
                  <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden flex items-center justify-center">
                    {imageSrc ? (
                      <img 
                        src={imageSrc} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="text-[50px] opacity-20">📦</div>
                    )}

                    {/* Selo de Vendido */}
                    {(item.status === 'sold' || item.status === 'Vendido') && (
                      <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white font-black px-3.5 py-1 rounded-full text-xs shadow-lg uppercase tracking-wider transform -rotate-6 border border-white/40">
                          🏷️ VENDIDO
                        </span>
                      </div>
                    )}

                    <div className="absolute top-[10px] left-[10px] flex flex-col gap-1">
                      <span className="px-[8px] py-[3px] rounded-[6px] bg-black/75 backdrop-blur text-[10px] font-bold text-white shadow-sm uppercase tracking-wide">
                        {item.condition || 'Usado'}
                      </span>
                      {item.accepts_trade && (
                        <span className="px-[8px] py-[3px] rounded-[6px] bg-purple-600/90 backdrop-blur text-[10px] font-extrabold text-white shadow-sm uppercase tracking-wide flex items-center gap-1">
                          🔄 Aceita Troca
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-[16px] flex-1 flex flex-col">
                    <div className="text-[17px] font-black mb-[4px] flex items-center justify-between flex-wrap gap-1">
                      {Number(item.price) > 0 ? (
                        <span className="text-[#1d2433]">R$ {Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                      ) : (
                        <span className="text-emerald-600 font-extrabold text-xs">🎁 Grátis / Doação</span>
                      )}
                      {(item.accepts_trade || item.type === 'Troca') && (
                        <span className="text-purple-600 font-extrabold text-[10px] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 inline-flex items-center gap-1">
                          🔄 Troca
                        </span>
                      )}
                    </div>
                    <h3 className="text-[14px] font-bold text-slate-800 mb-[10px] line-clamp-2 flex-1 leading-tight group-hover:text-[#ff6500] transition-colors">
                      {item.title}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-medium mt-auto flex items-center justify-between gap-[4px] pt-2 border-t border-slate-100">
                      <span className="truncate max-w-[110px]" title={item.neighborhood}>📍 {item.neighborhood || 'Bairro Local'}</span>
                      <span className="text-slate-400 font-semibold truncate max-w-[100px]" title={item.seller_name}>
                        👤 {item.seller_name || 'Morador'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DE INTEGRAÇÃO DE CONTA FALA DO BAIRRO */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6500] to-[#0284c7] flex items-center justify-center text-white text-3xl shadow-lg shadow-orange-500/20 mb-5 mx-auto">
              🤝
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-2">
              Acesso ao Marketplace
            </h3>
            
            <p className="text-slate-600 text-center text-sm mb-6 leading-relaxed">
              O Marketplace possui autenticação e painel de anúncios próprios. Você pode utilizar seu mesmo e-mail habitual para entrar ou criar sua conta de anunciante.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  navigate(`/login?redirect=${encodeURIComponent(authRedirectTarget)}`);
                }}
                className="w-full bg-[#ff6500] hover:bg-[#e95600] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
              >
                <span>🔑 Entrar no Marketplace</span>
              </button>

              <button
                onClick={() => {
                  setShowAuthModal(false);
                  navigate(`/register?redirect=${encodeURIComponent(authRedirectTarget)}`);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
              >
                <span>📝 Criar Conta no Marketplace</span>
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-5">
              Contas e sessões independentes. O mesmo e-mail pode ser utilizado com segurança.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
