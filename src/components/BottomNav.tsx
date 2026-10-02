import { Home, Newspaper, Megaphone, Store, PlusCircle } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  // Hide bottom nav on landing page
  if (location.pathname === '/') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center md:hidden z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-2xl pb-safe">
      <Link to="/feed" className={`flex flex-col items-center ${location.pathname === '/feed' ? 'text-blue-600' : 'text-slate-400'}`}>
        <Home className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-medium leading-none">Início</span>
      </Link>
      <Link to="/news" className={`flex flex-col items-center ${location.pathname === '/news' ? 'text-blue-600' : 'text-slate-400'}`}>
        <Newspaper className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-medium leading-none">Notícias</span>
      </Link>
      <Link to="/publish" className="relative -top-4 flex flex-col items-center">
        <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-medium leading-none mt-1 text-slate-600">Publicar</span>
      </Link>
      <Link to="/mural" className={`flex flex-col items-center ${location.pathname === '/mural' ? 'text-blue-600' : 'text-slate-400'}`}>
        <Megaphone className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-medium leading-none">Mural</span>
      </Link>
      <Link to="/guide" className={`flex flex-col items-center ${location.pathname === '/guide' ? 'text-blue-600' : 'text-slate-400'}`}>
        <Store className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-medium leading-none text-center">Guia<br/>Local</span>
      </Link>
    </div>
  );
}
