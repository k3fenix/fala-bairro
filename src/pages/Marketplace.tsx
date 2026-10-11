import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Search, Repeat, MapPin, RefreshCw, LogOut, Package, Heart, Sparkles } from 'lucide-react';
import { getAuthUser, UserSession } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';

export default function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, loading: authLoading, logout, refreshUser } = useAuth();
  
  const [typeFilter, setTypeFilter] = useState<'all' | 'Venda' | 'Troca' | 'Gratis'>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tradeOnlyFilter, setTradeOnlyFilter] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

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
    if (!currentUser) {
      alert('🔒 Para anunciar no Marketplace do Fala do Bairro, faça login ou cadastre-se com a sua conta de morador!');
      navigate('/login?redirect=/marketplace/anunciar');
      return;
    }
    navigate('/marketplace/anunciar');
  };

  const handleProtectedAction = (path: string) => {
    if (!currentUser) {
      alert('🔒 É obrigatório estar conectado para acessar esta área! Redirecionando para login...');
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
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
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-50">
        <div className="max-w-[1250px] mx-auto min-h-[72px] flex items-center gap-[20px] px-[20px] py-[12px] flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-[10px] min-w-auto sm:min-w-[220px] cursor-pointer flex-1 sm:flex-none" onClick={() => navigate('/')}>
            <div className="w-[45px] h-[45px] rounded-[14px] bg-gradient-to-br from-[#ff7a00] to-[#ff3d00] flex items-center justify-center text-white text-[23px] font-bold shrink-0 shadow-sm">
              FB
            </div>
            <div>
              <strong className="block text-[20px] text-[#202636] leading-none mb-[2px]">FALA DO BAIRRO</strong>
              <span className="block text-[#ff6500] text-[12px] font-bold uppercase tracking-wider">MARKETPLACE</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/'); }}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer ml-1"
              title="Voltar para a página principal do Fala do Bairro"
            >
              ⬅️ Portal Principal
            </button>
          </div>

          <div className="flex-1 relative order-3 sm:order-none w-full sm:w-auto mt-2 sm:mt-0">
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="O que você está procurando no bairro?" 
              className="w-full h-[48px] border border-[#ddd] rounded-[14px] pl-[18px] pr-[50px] outline-none bg-[#f7f7f8] focus:border-[#ff7200] focus:bg-white transition-colors"
            />
            <button className="absolute right-[5px] top-[5px] h-[38px] w-[42px] border-0 rounded-[10px] bg-[#ff6800] hover:bg-[#e95600] text-white flex items-center justify-center text-[18px] cursor-pointer">
              🔍
            </button>
          </div>

          {/* BOTÕES DE USUÁRIO / AUTENTICAÇÃO RESPONSIVOS */}
          <div className="flex items-center gap-[8px] order-2 sm:order-none ml-auto sm:ml-0">
            {/* Desktop Quick Links */}
            <button 
              onClick={() => handleProtectedAction('/marketplace/favoritos')} 
              className="hidden xl:inline-flex items-center gap-1.5 border border-[#e1e1e1] bg-white hover:bg-[#f5f5f5] px-[12px] py-[10px] rounded-[11px] text-[#333] font-semibold text-xs cursor-pointer"
            >
              ❤️ Favoritos
            </button>
            <button 
              onClick={() => handleProtectedAction('/marketplace/meus-anuncios')} 
              className="hidden lg:inline-flex items-center gap-1.5 border border-[#e1e1e1] bg-white hover:bg-[#f5f5f5] px-[12px] py-[10px] rounded-[11px] text-[#333] font-semibold text-xs cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-orange-500" /> Meus Anúncios
            </button>

            {/* Profile or Login */}
            {authLoading ? (
              <div className="w-28 h-10 bg-slate-100 animate-pulse rounded-xl"></div>
            ) : currentUser ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-[12px] shadow-sm">
                <div 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff7a00] to-[#ff3d00] text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-sm cursor-pointer"
                  onClick={() => navigate('/feed')}
                  title="Acessar Área do Usuário / Feed"
                >
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '👤'}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left leading-tight cursor-pointer" onClick={() => navigate('/feed')}>
                  <span className="block text-xs font-extrabold text-slate-800 truncate max-w-[110px]">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[110px] block">{currentUser.neighborhood || 'Morador'}</span>
                </div>
                <button 
                  onClick={() => handleProtectedAction('/marketplace/meus-anuncios')}
                  className="hidden md:inline-flex px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Ver Meus Anúncios Publicados"
                >
                  Meus Itens
                </button>
                <button 
                  onClick={() => navigate('/feed')} 
                  className="hidden md:inline-flex px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Voltar para a área do usuário / Feed"
                >
                  Feed ➔
                </button>
                <button 
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button 
                  onClick={() => navigate('/login?redirect=/marketplace')} 
                  className="border border-[#e1e1e1] bg-white hover:bg-[#f5f5f5] px-3 sm:px-[14px] py-2 sm:py-[11px] rounded-[11px] text-[#333] font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap shadow-2xs"
                  title="Entrar na sua conta"
                >
                  👤 Entrar
                </button>
                <button 
                  onClick={() => navigate('/register?redirect=/marketplace')} 
                  className="border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 sm:px-[14px] py-2 sm:py-[11px] rounded-[11px] font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap shadow-2xs"
                  title="Cadastrar nova conta no bairro"
                >
                  ✨ Cadastrar
                </button>
              </div>
            )}

            {/* BOTÃO + VENDER */}
            <button 
              onClick={handleProtectedSellClick} 
              className="border-0 bg-[#ff6500] hover:bg-[#e95600] text-white font-extrabold px-[16px] sm:px-[20px] py-[11px] sm:py-[13px] rounded-[12px] cursor-pointer shadow-md shadow-orange-500/20 whitespace-nowrap text-xs sm:text-sm"
            >
              + Vender
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="bg-gradient-to-br from-[#ff6500] to-[#ff3d00] text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 25%)' }}></div>
        <div className="max-w-[1250px] mx-auto min-h-[200px] p-[30px_20px] flex items-center justify-between gap-[30px] relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" /> Classificados de Confiança
            </div>
            <h1 className="text-[28px] sm:text-[clamp(28px,4.5vw,46px)] font-black leading-[1.1] mb-[10px]">
              Compre, Venda e Troque<br/>no Seu Bairro
            </h1>
            <p className="text-[15px] opacity-95 max-w-[550px]">
              Classificados locais de pessoas reais da sua vizinhança. Desapegue com facilidade e segurança.
            </p>
          </div>
          <div className="hidden md:flex w-[200px] min-h-[130px] rounded-[24px] bg-white/10 border border-white/20 items-center justify-center text-[65px] shrink-0 shadow-inner">
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

      {/* FOOTER */}
      <footer className="mt-[60px] bg-[#20242e] text-white p-[40px_20px]">
        <div className="max-w-[1250px] mx-auto flex flex-col md:flex-row justify-between gap-[30px]">
          <div>
            <strong className="text-lg">FALA DO BAIRRO MARKETPLACE</strong>
            <p className="text-[#aeb2bc] text-[13px] mt-[8px]">Compre, venda e troque com facilidade com moradores da sua região.</p>
          </div>
          <div>
            <strong>Dicas de Segurança</strong>
            <p className="text-[#aeb2bc] text-[13px] mt-[8px]">Prefira marcar encontros em locais públicos e movimentados.<br/>Não faça pagamentos antecipados.</p>
          </div>
          <div>
            <strong>Fala do Bairro</strong>
            <p className="text-[#aeb2bc] text-[13px] mt-[8px]">Comunidade • Notícias • Marketplace</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
