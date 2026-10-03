import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';

export default function Marketplace() {
  const navigate = useNavigate();
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
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
    const { data } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false });
    if (data) setListings(data);
    setLoading(false);
  };

  const checkMarketplaceStatus = async () => {
    const { data } = await supabase.from('marketplace_settings').select('*').eq('key', 'marketplace_enabled').single();
    if (data && data.value === 'true') {
      setIsEnabled(true);
    } else {
      setIsEnabled(false);
    }
  };

  if (isEnabled === null) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Carregando Marketplace...</div>;
  }

  if (isEnabled === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Store className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Marketplace Indisponível</h1>
        <p className="text-slate-500 mb-6 text-center max-w-md">O FALA DO BAIRRO MARKETPLACE está temporariamente em manutenção ou foi desativado pelo administrador.</p>
        <button onClick={() => navigate('/feed')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md">
          Voltar para a Comunidade
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2433]">
      {/* HEADER MARKETPLACE (Referência do HTML fornecido) */}
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-50">
        <div className="max-w-[1250px] mx-auto min-h-[72px] flex items-center gap-[25px] px-[20px] py-[12px] flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-[10px] min-w-auto sm:min-w-[230px] cursor-pointer flex-1 sm:flex-none" onClick={() => navigate('/feed')}>
            <div className="w-[45px] h-[45px] rounded-[14px] bg-gradient-to-br from-[#ff7a00] to-[#ff3d00] flex items-center justify-center text-white text-[23px] font-bold shrink-0">
              FB
            </div>
            <div>
              <strong className="block text-[20px] text-[#202636] leading-none mb-[2px]">FALA DO BAIRRO</strong>
              <span className="block text-[#ff6500] text-[12px] font-bold">MARKETPLACE</span>
            </div>
          </div>

          <div className="flex-1 relative order-3 sm:order-none w-full sm:w-auto mt-2 sm:mt-0">
            <input 
              type="text" 
              placeholder="O que você está procurando?" 
              className="w-full h-[48px] border border-[#ddd] rounded-[14px] pl-[18px] pr-[50px] outline-none bg-[#f7f7f8] focus:border-[#ff7200] focus:bg-white transition-colors"
            />
            <button className="absolute right-[5px] top-[5px] h-[38px] w-[42px] border-0 rounded-[10px] bg-[#ff6800] hover:bg-[#e95600] text-white flex items-center justify-center text-[18px]">
              🔎
            </button>
          </div>

          <div className="hidden lg:flex gap-[8px]">
            <button className="border border-[#e1e1e1] bg-white hover:bg-[#f5f5f5] px-[14px] py-[11px] rounded-[11px] text-[#333]">
              ❤️ Favoritos
            </button>
            <button className="border border-[#e1e1e1] bg-white hover:bg-[#f5f5f5] px-[14px] py-[11px] rounded-[11px] text-[#333]">
              👤 Minha conta
            </button>
          </div>

          <button onClick={() => navigate('/marketplace/anunciar')} className="border-0 bg-[#ff6500] hover:bg-[#e95600] text-white font-bold px-[18px] py-[13px] rounded-[12px] order-2 sm:order-none">
            + Vender
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-[#ff6500] to-[#ff3d00] text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 25%)' }}></div>
        <div className="max-w-[1250px] mx-auto min-h-[260px] p-[45px_20px] flex items-center justify-between gap-[30px] relative z-10">
          <div>
            <h1 className="text-[35px] sm:text-[clamp(32px,5vw,52px)] font-bold leading-[1.05] mb-[14px]">
              Compre. Venda.<br/>Encontre.
            </h1>
            <p className="text-[17px] opacity-95 max-w-[600px]">
              O Marketplace do Fala do Bairro. Produtos e serviços de pessoas de todo o Brasil.
            </p>
            <div className="mt-[22px] inline-flex items-center gap-[8px] px-[15px] py-[10px] rounded-[30px] bg-white/15 border border-white/25">
              📍 Todo o Brasil
            </div>
          </div>
          <div className="hidden md:flex w-[260px] min-h-[160px] rounded-[25px] bg-white/10 border border-white/20 items-center justify-center text-[80px]">
            🛍️
          </div>
        </div>
      </section>

      <main className="max-w-[1250px] mx-auto p-[30px_20px]">
        {/* CATEGORIAS */}
        <div className="mb-[40px]">
          <h2 className="text-[20px] font-bold text-[#1d2433] mb-[15px]">Explorar Categorias</h2>
          <div className="flex gap-[12px] overflow-x-auto pb-[10px] snap-x no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            <button 
              onClick={() => setActiveCategory('all')}
              className={`snap-start shrink-0 flex flex-col items-center justify-center w-[90px] h-[90px] rounded-[18px] border transition-all ${activeCategory === 'all' ? 'border-[#ff6500] bg-[#fff5ef] text-[#ff6500]' : 'border-[#e7e7e7] bg-white hover:border-[#ccc]'}`}
            >
              <div className="text-[28px] mb-[4px]">🌟</div>
              <span className="text-[13px] font-bold">Todos</span>
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`snap-start shrink-0 flex flex-col items-center justify-center w-[90px] h-[90px] rounded-[18px] border transition-all ${activeCategory === cat.id.toString() ? 'border-[#ff6500] bg-[#fff5ef] text-[#ff6500]' : 'border-[#e7e7e7] bg-white hover:border-[#ccc]'}`}
              >
                <div className="text-[28px] mb-[4px]">{cat.icon}</div>
                <span className="text-[13px] font-bold text-center leading-tight px-1">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LISTINGS GRID */}
        <div className="mb-[20px] flex justify-between items-end">
          <h2 className="text-[24px] font-bold text-[#1d2433]">Recomendações para você</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Carregando anúncios...</div>
        ) : listings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 shadow-sm mt-4">
             <Store className="w-16 h-16 mx-auto mb-4 text-slate-300" />
             <p className="text-xl font-bold text-slate-700 mb-2">Nenhum anúncio encontrado.</p>
             <p>Seja o primeiro a publicar algo à venda!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[20px]">
            {listings.filter(l => activeCategory === 'all' || l.category_id?.toString() === activeCategory).map(item => (
              <div key={item.id} className="bg-white border border-[#e7e7e7] rounded-[18px] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(0,0,0,0.06)] group flex flex-col cursor-pointer" onClick={() => navigate(`/marketplace/anuncio/${item.id}`)}>
                <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden flex items-center justify-center">
                  <div className="text-[50px] opacity-20">📦</div>
                  <button className="absolute top-[12px] right-[12px] w-[35px] h-[35px] rounded-full bg-white/90 backdrop-blur text-[#666] flex items-center justify-center text-[18px] hover:text-[#ff3d00] transition-colors z-10 shadow-sm">
                    ♡
                  </button>
                  <div className="absolute top-[12px] left-[12px] px-[10px] py-[4px] rounded-[8px] bg-white/90 backdrop-blur text-[11px] font-bold text-[#333] shadow-sm uppercase tracking-wide">
                    {item.condition || 'Usado'}
                  </div>
                </div>
                <div className="p-[16px] flex-1 flex flex-col">
                  <div className="text-[20px] font-black text-[#1d2433] mb-[6px]">
                    {Number(item.price) > 0 ? `R$ ${Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Grátis'}
                  </div>
                  <h3 className="text-[15px] font-medium text-[#444] mb-[12px] line-clamp-2 flex-1 leading-tight">
                    {item.title}
                  </h3>
                  <div className="text-[12px] text-[#888] font-medium mt-auto flex items-center gap-[6px]">
                    📍 <span className="truncate">{item.neighborhood}, {item.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-[50px] bg-[#20242e] text-white p-[40px_20px]">
        <div className="max-w-[1250px] mx-auto flex flex-col md:flex-row justify-between gap-[30px]">
          <div>
            <strong>FALA DO BAIRRO MARKETPLACE</strong>
            <p className="text-[#aeb2bc] text-[13px] mt-[8px]">Compre, venda e encontre em todo o Brasil.</p>
          </div>
          <div>
            <strong>Segurança</strong>
            <p className="text-[#aeb2bc] text-[13px] mt-[8px]">Denuncie anúncios suspeitos.<br/>Não compartilhe dados sensíveis.</p>
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
