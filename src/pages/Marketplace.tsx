import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Store, Search, Repeat } from 'lucide-react';

export default function Marketplace() {
  const navigate = useNavigate();
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tradeOnlyFilter, setTradeOnlyFilter] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMarketplaceStatus();
  }, []);

  useEffect(() => {
    if (isEnabled) {
      fetchCategories();
      fetchListings();
    }
  }, [isEnabled]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('marketplace_categories').select('*').eq('is_active', true).order('order_index');
    if (data) setCategories(data);
  };

  const fetchListings = async () => {
    setLoading(true);

    // 1. Tentar buscar em marketplace_listings
    const { data: listingsData } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false });
    
    // 2. Tentar buscar em marketplace_items (compatibilidade retroativa)
    const { data: itemsData } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });

    const combinedListings: any[] = [];
    const seenIds = new Set();

    if (listingsData) {
      listingsData.forEach(l => {
        seenIds.add(l.id || l.title);
        combinedListings.push(l);
      });
    }

    if (itemsData) {
      itemsData.forEach(item => {
        if (!seenIds.has(item.id || item.title)) {
          combinedListings.push({
            id: item.id,
            title: item.title,
            description: item.description,
            price: item.price,
            condition: item.condition || 'Usado',
            accepts_trade: item.type === 'Troca',
            neighborhood: item.neighborhood || 'Bairro Local',
            city: 'Campinas',
            whatsapp: item.seller_whatsapp,
            image_url: item.image,
            image: item.image
          });
        }
      });
    }

    setListings(combinedListings);
    setLoading(false);
  };

  const checkMarketplaceStatus = async () => {
    const { data } = await supabase.from('marketplace_settings').select('*').eq('key', 'marketplace_enabled').single();
    if (data && data.value === 'true') {
      setIsEnabled(true);
    } else {
      setIsEnabled(true); // Manter ativado por padrão para teste
    }
  };

  const filteredListings = listings.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category_id?.toString() === activeCategory;
    const matchesSearch = !searchQuery.trim() || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTrade = !tradeOnlyFilter || item.accepts_trade === true;

    return matchesCategory && matchesSearch && matchesTrade;
  });

  const handleProtectedSellClick = () => {
    const userStr = localStorage.getItem('user') || localStorage.getItem('impersonatedUser');
    const userAuth = localStorage.getItem('user_auth');
    if (!userStr && userAuth !== 'true') {
      alert('🔒 Para vender no Marketplace do Fala do Bairro é obrigatório estar cadastrado e conectado! Por favor, faça seu cadastro ou login.');
      navigate('/register');
      return;
    }
    navigate('/marketplace/anunciar');
  };

  const handleProtectedAction = (path: string) => {
    const userStr = localStorage.getItem('user') || localStorage.getItem('impersonatedUser');
    const userAuth = localStorage.getItem('user_auth');
    if (!userStr && userAuth !== 'true') {
      alert('🔒 É obrigatório estar conectado para acessar esta área! Redirecionando para o cadastro...');
      navigate('/register');
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

          <div className="hidden lg:flex gap-[8px]">
            <button onClick={() => handleProtectedAction('/marketplace/favoritos')} className="border border-[#e1e1e1] bg-white hover:bg-[#f5f5f5] px-[14px] py-[11px] rounded-[11px] text-[#333] font-semibold text-sm cursor-pointer">
              ❤️ Favoritos
            </button>
            <button onClick={() => handleProtectedAction('/marketplace/meus-anuncios')} className="border border-[#e1e1e1] bg-white hover:bg-[#f5f5f5] px-[14px] py-[11px] rounded-[11px] text-[#333] font-semibold text-sm cursor-pointer">
              📦 Meus Anúncios
            </button>
            <button onClick={() => navigate('/register')} className="border border-[#e1e1e1] bg-white hover:bg-[#f5f5f5] px-[14px] py-[11px] rounded-[11px] text-[#333] font-bold text-sm cursor-pointer" title="Entrar ou Cadastrar">
              👤 Entrar / Cadastrar
            </button>
          </div>

          <button onClick={handleProtectedSellClick} className="border-0 bg-[#ff6500] hover:bg-[#e95600] text-white font-extrabold px-[20px] py-[13px] rounded-[12px] order-2 sm:order-none cursor-pointer shadow-md shadow-orange-500/20">
            + Vender
          </button>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="bg-gradient-to-br from-[#ff6500] to-[#ff3d00] text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 25%)' }}></div>
        <div className="max-w-[1250px] mx-auto min-h-[220px] p-[35px_20px] flex items-center justify-between gap-[30px] relative z-10">
          <div>
            <h1 className="text-[32px] sm:text-[clamp(30px,4.5vw,48px)] font-extrabold leading-[1.1] mb-[12px]">
              Compre, Venda e Troque<br/>no Seu Bairro
            </h1>
            <p className="text-[16px] opacity-95 max-w-[550px]">
              Classificados locais de pessoas reais do seu bairro. Desapegue com facilidade.
            </p>
          </div>
          <div className="hidden md:flex w-[220px] min-h-[140px] rounded-[24px] bg-white/10 border border-white/20 items-center justify-center text-[70px] shrink-0">
            🛍️
          </div>
        </div>
      </section>

      <main className="max-w-[1250px] mx-auto p-[30px_20px]">
        {/* CATEGORIAS */}
        <div className="mb-[32px]">
          <div className="flex justify-between items-center mb-[14px]">
            <h2 className="text-[20px] font-bold text-[#1d2433]">Explorar Categorias</h2>
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
              className={`snap-start shrink-0 flex flex-col items-center justify-center w-[90px] h-[90px] rounded-[18px] border transition-all cursor-pointer ${activeCategory === 'all' ? 'border-[#ff6500] bg-[#fff5ef] text-[#ff6500] font-black' : 'border-[#e7e7e7] bg-white hover:border-[#ccc]'}`}
            >
              <div className="text-[26px] mb-[4px]">🌟</div>
              <span className="text-[12px] font-bold">Todos</span>
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`snap-start shrink-0 flex flex-col items-center justify-center w-[90px] h-[90px] rounded-[18px] border transition-all cursor-pointer ${activeCategory === cat.id.toString() ? 'border-[#ff6500] bg-[#fff5ef] text-[#ff6500] font-black' : 'border-[#e7e7e7] bg-white hover:border-[#ccc]'}`}
              >
                <div className="text-[26px] mb-[4px]">{cat.icon}</div>
                <span className="text-[12px] font-bold text-center leading-tight px-1">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LISTINGS GRID */}
        <div className="mb-[20px] flex justify-between items-end">
          <h2 className="text-[22px] font-bold text-[#1d2433]">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Produtos do Bairro'}
          </h2>
          <span className="text-xs text-slate-500 font-semibold">{filteredListings.length} produtos encontrados</span>
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
                    <div className="text-[20px] font-black text-[#1d2433] mb-[4px]">
                      {Number(item.price) > 0 ? `R$ ${Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Grátis'}
                    </div>
                    <h3 className="text-[14px] font-bold text-slate-800 mb-[10px] line-clamp-2 flex-1 leading-tight group-hover:text-[#ff6500] transition-colors">
                      {item.title}
                    </h3>
                    <div className="text-[12px] text-slate-500 font-medium mt-auto flex items-center gap-[4px] pt-2 border-t border-slate-100">
                      📍 <span className="truncate">{item.neighborhood || 'Bairro Local'}</span>
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
