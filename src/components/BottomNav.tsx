import { Home, Flame, PlusCircle, Bell, User } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  // Hide bottom nav on landing page
  if (location.pathname === '/') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center md:hidden z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-2xl">
      <Link to="/feed" className={`flex flex-col items-center ${location.pathname === '/feed' ? 'text-blue-600' : 'text-slate-400'}`}>
        <Home className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Início</span>
      </Link>
      <Link to="/trending" className="flex flex-col items-center text-slate-400">
        <Flame className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Em alta</span>
      </Link>
      <Link to="/publish" className="relative -top-5 flex flex-col items-center">
        <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
          <PlusCircle className="w-7 h-7" />
        </div>
      </Link>
      <Link to="/notifications" className="flex flex-col items-center text-slate-400">
        <Bell className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Avisos</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center text-slate-400">
        <User className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Perfil</span>
      </Link>
    </div>
  );
}
