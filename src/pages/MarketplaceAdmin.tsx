import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseMarketplace } from '../lib/supabaseMarketplace';
import { supabase } from '../lib/supabase';
import { 
  Package, CheckCircle, XCircle, Trash2, Eye, ShieldCheck, 
  Search, RefreshCw, ArrowLeft, LogOut, Tags, AlertOctagon 
} from 'lucide-react';

export default function MarketplaceAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'listings' | 'categories' | 'reports'>('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Autenticação administrativa independente do Marketplace
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('marketplace_admin_auth') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, activeTab]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha inicial de gestão segura ou verificação de credencial
    if (adminPasswordInput === 'admin123' || adminPasswordInput === 'marketplace2026') {
      localStorage.setItem('marketplace_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Senha de acesso administrativo inválida.');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('marketplace_admin_auth');
    setIsAuthenticated(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings') {
        const [resListings, resItems] = await Promise.all([
          supabaseMarketplace.from('marketplace_listings').select('*').order('created_at', { ascending: false }),
          supabase.from('marketplace_items').select('*').order('created_at', { ascending: false })
        ]);

        const combined: any[] = [];
        const seenIds = new Set<string>();

        if (resListings?.data) {
          resListings.data.forEach(l => {
            if (l?.id) {
              seenIds.add(l.id.toString());
              combined.push(l);
            }
          });
        }

        if (resItems?.data) {
          resItems.data.forEach(item => {
            if (item?.id && !seenIds.has(item.id.toString())) {
              combined.push({
                id: item.id,
                title: item.title,
                description: item.description,
                price: item.price,
                condition: item.condition || 'Usado',
                type: item.type || (item.accepts_trade ? 'Troca' : 'Venda'),
                seller_name: item.seller_name || 'Vendedor',
                whatsapp: item.seller_whatsapp || item.whatsapp,
                neighborhood: item.neighborhood,
                city: 'Campinas',
                status: item.status === 'Ativo' ? 'approved' : item.status,
                created_at: item.created_at
              });
            }
          });
        }

        setListings(combined);
      } else if (activeTab === 'categories') {
        const { data } = await supabaseMarketplace
          .from('marketplace_categories')
          .select('*')
          .order('order_index');
        if (data) setCategories(data);
      } else if (activeTab === 'reports') {
        const { data } = await supabaseMarketplace
          .from('marketplace_reports')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setReports(data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados administrativos:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateListingStatus = async (id: string, newStatus: string) => {
    try {
      // 1. Tabela oficial do Marketplace: marketplace_listings
      const { error: errOfficial } = await supabaseMarketplace
        .from('marketplace_listings')
        .update({ status: newStatus })
        .eq('id', id);

      // 2. Se falhar, tenta na tabela legada silenciosamente caso exista
      if (errOfficial) {
        try {
          await supabase.from('marketplace_items').update({ status: newStatus === 'approved' ? 'Ativo' : newStatus }).eq('id', id);
        } catch (_) {}
      }

      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      try {
        localStorage.removeItem('cache_marketplace_listings');
      } catch (_) {}
    } catch (e: any) {
      alert('Erro ao atualizar status: ' + e.message);
    }
  };

  const deleteListing = async (id: string) => {
    if (confirm('Confirma a remoção definitiva deste anúncio?')) {
      try {
        // 1. Remover imagens filhas vinculadas ao anúncio oficial
        try {
          await supabaseMarketplace.from('marketplace_listing_images').delete().eq('listing_id', id);
        } catch (_) {}

        // 2. Excluir da tabela oficial do Marketplace
        const { error: errOfficial } = await supabaseMarketplace
          .from('marketplace_listings')
          .delete()
          .eq('id', id);

        // 3. Se houver falha, tenta na tabela legada (apenas se existir)
        if (errOfficial) {
          try {
            await supabase.from('marketplace_items').delete().eq('id', id);
          } catch (_) {}
        }

        // 4. Atualizar lista na interface imediatamente
        setListings(prev => prev.filter(l => l.id !== id));

        // 5. Limpar cache local para sincronizar na hora com todo o Marketplace
        try {
          localStorage.removeItem('cache_marketplace_listings');
        } catch (_) {}

        alert('Anúncio excluído com sucesso!');
      } catch (e: any) {
        alert('Erro ao excluir anúncio: ' + e.message);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-br from-[#ff6500] to-[#ff3d00] rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg shadow-orange-500/20">
            🛡️
          </div>
          <h2 className="text-2xl font-black text-center text-slate-900 mb-1">Marketplace Admin</h2>
          <p className="text-sm text-center text-slate-500 mb-6">Painel Administrativo Independente do Fala do Bairro Marketplace</p>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Chave de Acesso Administrativo</label>
              <input 
                type="password" 
                value={adminPasswordInput}
                onChange={e => setAdminPasswordInput(e.target.value)}
                placeholder="Digite a senha administrativa..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white font-medium"
                required
              />
            </div>
            {authError && <p className="text-xs text-red-600 font-bold">{authError}</p>}
            <button 
              type="submit"
              className="w-full bg-[#ff6500] hover:bg-[#e95600] text-white font-bold py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Entrar no Painel
            </button>
            <button 
              type="button"
              onClick={() => navigate('/marketplace')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-xs"
            >
              ⬅️ Voltar ao Marketplace
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredListings = listings.filter(l => {
    const matchesSearch = !searchTerm || 
      (l.title && l.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.seller_name && l.seller_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16">
      {/* HEADER ADMIN MARKETPLACE */}
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff6500] flex items-center justify-center font-black text-sm">FB</div>
          <h1 className="text-lg font-bold tracking-tight">MARKETPLACE <span className="text-orange-400 font-medium">| Moderação & Admin</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/marketplace')} className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Ver Marketplace
          </button>
          <div className="w-px h-5 bg-slate-700"></div>
          <button onClick={handleAdminLogout} className="flex items-center gap-1.5 text-slate-300 hover:text-red-400 text-xs font-bold transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* NAVEGAÇÃO ENTRE ABAS */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors ${activeTab === 'listings' ? 'bg-[#ff6500] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <Package className="w-4 h-4" /> Anúncios ({listings.length})
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors ${activeTab === 'categories' ? 'bg-[#ff6500] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <Tags className="w-4 h-4" /> Categorias
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors ${activeTab === 'reports' ? 'bg-[#ff6500] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <AlertOctagon className="w-4 h-4" /> Denúncias
          </button>
          <button 
            onClick={loadData}
            className="ml-auto p-2 bg-white hover:bg-slate-50 rounded-xl text-slate-500 border border-slate-200 cursor-pointer"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ABA: ANÚNCIOS */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por título ou anunciante..." 
                  className="w-full bg-slate-50 border-0 outline-none text-sm font-medium py-1.5 px-3 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold py-1.5 px-3 rounded-lg outline-none cursor-pointer"
                >
                  <option value="all">Todos</option>
                  <option value="approved">Aprovados</option>
                  <option value="pending">Pendentes</option>
                  <option value="paused">Pausados</option>
                  <option value="sold">Vendidos</option>
                  <option value="rejected">Rejeitados</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">Carregando anúncios...</div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
                Nenhum anúncio localizado com os filtros selecionados.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase">
                      <th className="p-4">Produto</th>
                      <th className="p-4">Preço / Tipo</th>
                      <th className="p-4">Anunciante</th>
                      <th className="p-4">Local</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredListings.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <strong className="block text-slate-800">{l.title}</strong>
                          <span className="text-xs text-slate-400">ID: {l.id.substring(0, 8)}...</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-slate-800">
                            {Number(l.price) === 0 ? 'Grátis' : `R$ ${Number(l.price).toFixed(2)}`}
                          </span>
                          <span className="block text-xs text-slate-400">{l.type || 'Venda'}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-slate-700">{l.seller_name || 'Vendedor'}</span>
                          <span className="block text-xs text-slate-400">{l.whatsapp || 'Sem Whats'}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-600">
                          {l.neighborhood || l.city}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            l.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            l.status === 'sold' ? 'bg-slate-100 text-slate-600' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => navigate(`/marketplace/editar/${l.id}`)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg cursor-pointer"
                              title="Editar este anúncio"
                            >
                              ✏️
                            </button>

                            {l.status !== 'approved' && (
                              <button 
                                onClick={() => updateListingStatus(l.id, 'approved')}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg cursor-pointer"
                                title="Aprovar anúncio"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {l.status !== 'rejected' && (
                              <button 
                                onClick={() => updateListingStatus(l.id, 'rejected')}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg cursor-pointer"
                                title="Rejeitar anúncio"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => deleteListing(l.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer"
                              title="Remover anúncio definitivamente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                const targetName = l.seller_name || 'este anunciante';
                                if (confirm(`🚨 BANIR USUÁRIO:\nDeseja realmente BANIR e BLOQUEAR o usuário "${targetName}" para sempre?`)) {
                                  if (l.user_id) {
                                    await supabase.from('profiles').update({ is_banned: true, banned: true, status: 'banned' }).eq('id', l.user_id);
                                    await supabaseMarketplace.from('marketplace_listings').update({ status: 'banned' }).eq('user_id', l.user_id);
                                  }
                                  await updateListingStatus(l.id, 'banned');
                                  alert(`Usuário "${targetName}" banido com sucesso!`);
                                }
                              }}
                              className="p-1.5 bg-slate-900 hover:bg-black text-amber-300 rounded-lg cursor-pointer"
                              title="Bloquear / Banir usuário para sempre"
                            >
                              🚫
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ABA: CATEGORIAS */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-800 mb-4">Categorias do Marketplace</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-2xl">{c.icon || '📦'}</span>
                  <div>
                    <strong className="block text-slate-800 text-sm">{c.name}</strong>
                    <span className="text-xs text-slate-400">{c.slug}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: DENÚNCIAS */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-800 mb-4">Denúncias Registradas</h3>
            {reports.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhuma denúncia aberta no momento.</p>
            ) : (
              <div className="space-y-3">
                {reports.map(r => (
                  <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-red-600 block text-sm">Motivo: {r.reason}</strong>
                    <p className="text-slate-600 text-xs mt-1">{r.details}</p>
                    <span className="text-slate-400 text-[10px] mt-2 block">Status: {r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
