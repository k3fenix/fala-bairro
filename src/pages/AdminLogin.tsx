import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'lucianoalkine@gmail.com' && password === '14182171Lu@') {
      // For now, using localStorage to mock auth session
      localStorage.setItem('admin_auth', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('Credenciais inválidas. Acesso restrito.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600/20 p-4 rounded-full">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-2">Acesso Restrito</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Painel Administrativo - Fala do Bairro</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">E-mail Administrativo</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="admin@faladobairro.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-4"
          >
            ENTRAR NO PAINEL
          </button>
        </form>
      </div>
    </div>
  );
}
