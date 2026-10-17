import { Home, Newspaper, Megaphone, Store, PlusCircle, ShoppingBag, User } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  // Ocultar barra inferior na landing page
  if (location.pathname === '/') return null;

  const isMarketplace = location.pathname.startsWith('/marketplace');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex justify-around items-center md:hidden z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] rounded-t-2xl pb-safe">
      <Link 
        to="/feed" 
        className={`flex flex-col items-center transition-colors ${location.pathname === '/feed' ? 'text-[#ff6500] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <Home className="w-5 h-5 mb-1" />
        <span className="text-[10px] leading-none">Início</span>
      </Link>

      <Link 
        to="/marketplace" 
        className={`flex flex-col items-center transition-colors ${isMarketplace ? 'text-[#ff6500] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <ShoppingBag className="w-5 h-5 mb-1" />
        <span className="text-[10px] leading-none">Marketplace</span>
      </Link>

      <Link 
        to={isMarketplace ? "/marketplace/anunciar" : "/publish"} 
        className="relative -top-3 flex flex-col items-center"
      >
        <div className="bg-[#ff6500] text-white p-3 rounded-full shadow-lg shadow-orange-500/30 hover:bg-[#e95600] transition-colors">
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-black leading-none mt-1 text-slate-700">
          {isMarketplace ? 'Anunciar' : 'Publicar'}
        </span>
      </Link>

      <Link 
        to="/marketplace/meus-anuncios" 
        className={`flex flex-col items-center transition-colors ${location.pathname === '/marketplace/meus-anuncios' ? 'text-[#ff6500] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <Megaphone className="w-5 h-5 mb-1" />
        <span className="text-[10px] leading-none">Meus Itens</span>
      </Link>

      <Link 
        to="/marketplace/perfil" 
        className={`flex flex-col items-center transition-colors ${location.pathname === '/marketplace/perfil' ? 'text-[#ff6500] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <User className="w-5 h-5 mb-1" />
        <span className="text-[10px] leading-none">Conta</span>
      </Link>
    </div>
  );
}
