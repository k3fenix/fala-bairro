import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, AlertTriangle, MessageSquare, LogOut, Ban, Edit, Trash2, Send, Megaphone, ArrowLeft, CheckCircle, XCircle, LayoutDashboard, Save, Store, Plus, Wallet, Lock, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (localStorage.getItem('admin_auth') !== 'true') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tight">FALA DO BAIRRO <span className="text-blue-400 font-medium">| Admin</span></h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/feed')} className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar ao App</span>
          </button>
          <div className="w-px h-5 bg-slate-700"></div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-4 gap-2 overflow-y-auto">
          <TabButton icon={<AlertTriangle />} label="Visão Geral" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <TabButton icon={<Users />} label="Gerenciar Usuários" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabButton icon={<Store />} label="Guia Comercial" active={activeTab === 'commercial'} onClick={() => setActiveTab('commercial')} />
          <TabButton icon={<AlertTriangle />} label="Pets Perdidos" active={activeTab === 'pets'} onClick={() => setActiveTab('pets')} />
          <TabButton icon={<Megaphone />} label="Mural de Avisos" active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />
          <TabButton icon={<Store />} label="Marketplace V2" active={activeTab === 'marketplace'} onClick={() => setActiveTab('marketplace')} />
          <TabButton icon={<LayoutDashboard />} label="Capa do Site" active={activeTab === 'landing'} onClick={() => setActiveTab('landing')} />
          <TabButton icon={<Wallet />} label="Monetização" active={activeTab === 'monetization'} onClick={() => setActiveTab('monetization')} />
          <TabButton icon={<Trash2 />} label="Exclusões de Conta" active={activeTab === 'deletions'} onClick={() => setActiveTab('deletions')} />
          <TabButton icon={<Lock />} label="Minha Conta Admin" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
        </div>

        <div className="flex-1 p-6 max-w-6xl overflow-y-auto">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'commercial' && <CommercialTab />}
          {activeTab === 'pets' && <PetsTab />}
          {activeTab === 'announcements' && <AnnouncementsTab />}
          {activeTab === 'landing' && <LandingConfigTab />}
          {activeTab === 'marketplace' && <MarketplaceAdminTab />}
          {activeTab === 'monetization' && <MonetizationTab />}
          {activeTab === 'deletions' && <DeletionsTab />}
          {activeTab === 'security' && <AdminSecurityTab />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors w-full text-left ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function CommercialTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [formImage, setFormImage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('commercial_guide').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      await supabase.from('commercial_guide').delete().eq('id', id);
      fetchItems();
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const item = {
      name: formData.get('name'),
      category: formData.get('category'),
      description: formData.get('description'),
      whatsapp: formData.get('whatsapp'),
      neighborhood: formData.get('neighborhood') || 'Jardim Mário Covas',
      image: formImage || formData.get('image') || null,
      rating: Number(formData.get('rating') || 5),
      is_verified: formData.get('is_verified') === 'on',
    };

    if (editing?.id) {
      await supabase.from('commercial_guide').update(item).eq('id', editing.id);
    } else {
      await supabase.from('commercial_guide').insert([item]);
    }
    setEditing(null);
    setFormImage('');
    fetchItems();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(term) ||
      (item.category || '').toLowerCase().includes(term) ||
      (item.neighborhood || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">🏪 Guia Comercial e Serviços Locais</h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie as empresas parceiras e prestadores de serviços do bairro</p>
        </div>
        <button onClick={() => { setEditing({}); setFormImage(''); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all">
          <Plus className="w-5 h-5" /> Adicionar Comércio
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex gap-3 items-center">
        <span className="text-slate-400 text-lg">🔍</span>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar comércio por nome, categoria, serviço ou bairro..."
          className="w-full text-sm font-medium outline-none bg-transparent text-slate-800"
        />
        {searchTerm && (
          <button type="button" onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
            Limpar
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Negócio</label>
            <input name="name" defaultValue={editing.name} required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
            <input name="category" defaultValue={editing.category} required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">📝 Funções, Serviços Prestados e Especificações *</label>
            <textarea name="description" defaultValue={editing.description} rows={4} placeholder="Ex: Conserto de celulares e computadores, troca de telas, manutenção de notebooks, baterias e capinhas. Orçamento rápido sem compromisso!" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:border-blue-500 outline-none leading-relaxed text-sm"></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp (apenas números)</label>
            <input name="whatsapp" defaultValue={editing.whatsapp} required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">URL da Imagem/Logo (Opcional)</label>
            <input type="file" accept="image/*" onChange={handleImageFileChange} className="text-xs text-slate-600 mb-2 block file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer" />
            <input name="image" value={formImage || editing.image || ''} onChange={(e) => setFormImage(e.target.value)} placeholder="Ou cole o link direto da imagem" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Bairro</label>
            <input name="neighborhood" defaultValue={editing.neighborhood} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
          </div>
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nota (1 a 5)</label>
              <input name="rating" type="number" step="0.1" defaultValue={editing.rating || 5} className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
            </div>
            <label className="flex items-center gap-2 mt-5 cursor-pointer">
              <input type="checkbox" name="is_verified" defaultChecked={editing.is_verified ?? true} className="w-5 h-5 accent-emerald-500" />
              <span className="font-bold text-slate-700">Comércio Verificado</span>
            </label>
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Salvar Cadastro</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col group">
            {/* Foto no Topo */}
            <div className="h-44 w-full bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-4 -z-0">
                <span className="text-4xl mb-1">🏪</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">{item.name}</span>
              </div>

              <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                <span className="bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  {item.category}
                </span>
                {item.is_verified && (
                  <span className="bg-emerald-500/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                    ✓ Verificado
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full shadow z-10">
                ⭐ {item.rating || '5.0'}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xl leading-tight mb-1">{item.name}</h3>
                <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">{item.category}</p>
                {item.description && (
                  <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {item.description}
                  </p>
                )}
                {item.address && (
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    📍 {item.address}
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                <a 
                  href={`https://wa.me/55${item.whatsapp?.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-full shadow-sm transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {item.whatsapp}
                </a>
                <div className="flex gap-1.5">
              <button onClick={() => setEditing(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
            </div>
                </div>
              </div>
            </div>
{/* end card */}
        ))}
      </div>
    </div>
  );
}

function PetsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('lost_pets').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      await supabase.from('lost_pets').delete().eq('id', id);
      fetchItems();
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const item = {
      pet_name: formData.get('pet_name'),
      species: formData.get('species'),
      description: formData.get('description'),
      last_seen_location: formData.get('last_seen_location'),
      owner_whatsapp: formData.get('owner_whatsapp'),
      image: formData.get('image'),
      status: formData.get('status'),
    };

    if (editing?.id) {
      await supabase.from('lost_pets').update(item).eq('id', editing.id);
    } else {
      await supabase.from('lost_pets').insert([item]);
    }
    setEditing(null);
    fetchItems();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Pets Perdidos</h2>
        <button onClick={() => setEditing({})} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Adicionar Pet
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Pet</label>
            <input name="pet_name" defaultValue={editing.pet_name} required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Espécie (Ex: Cachorro)</label>
            <input name="species" defaultValue={editing.species} required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
            <textarea name="description" defaultValue={editing.description} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 h-20"></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Visto por último em</label>
            <input name="last_seen_location" defaultValue={editing.last_seen_location} required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp do Tutor</label>
            <input name="owner_whatsapp" defaultValue={editing.owner_whatsapp} required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
            <select name="status" defaultValue={editing.status || 'Perdido'} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <option value="Perdido">Perdido (Alerta)</option>
              <option value="Encontrado">Encontrado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Link da Imagem (Opcional)</label>
            <input name="image" defaultValue={editing.image} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
          </div>
          
          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Salvar Alerta</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative">
            <div className="flex gap-4">
               {item.image && <img src={item.image} className="w-16 h-16 rounded-lg object-cover" />}
               <div>
                 <h3 className="font-bold text-slate-800 text-lg">{item.pet_name}</h3>
                 <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 'Perdido' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{item.status}</span>
               </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setEditing(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTab() {
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    setTotalUsers(userCount || 0);

    const { data: postsData } = await supabase.from('posts').select('*');
    if (postsData) {
      setTotalPosts(postsData.length);
      setPendingPosts(postsData.filter(p => p.is_pending));
    }
  };

  const handleApprovePost = async (id: number, currentCategory: string) => {
    let finalCategory = currentCategory;
    
    // Pergunta se quer alterar a categoria para exibição
    const newCat = prompt(`Defina a categoria final para ir para a página inicial (ex: Denúncia ou Postagem):\n(Deixe em branco para manter: ${currentCategory})`, currentCategory);
    
    if (newCat !== null && newCat.trim() !== '') {
      finalCategory = newCat.trim();
    } else if (newCat === null) {
      // Cancelou a aprovação
      return;
    }

    await supabase.from('posts').update({ is_pending: false, is_approved: true, category: finalCategory }).eq('id', id);
    alert('Postagem aprovada e enviada para o Feed e Página Inicial.');
    fetchStats();
  };

  const handleRejectPost = async (id: number) => {
    await supabase.from('posts').delete().eq('id', id);
    alert('Postagem rejeitada e excluída.');
    fetchStats();
  };

  const denuncias = pendingPosts.filter(p => p.category === 'Denúncia' || p.category.includes('Denúncia'));
  const postagens = pendingPosts.filter(p => p.category !== 'Denúncia' && !p.category.includes('Denúncia'));

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
        <div className="bg-slate-200 border border-slate-300 text-slate-500 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 cursor-not-allowed" title="Em breve">
          <span>[ MONETIZAÇÃO: DESATIVADA ]</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Usuários" value={totalUsers} icon={<Users className="w-6 h-6 text-blue-500" />} />
        <StatCard title="Publicações" value={totalPosts} icon={<FileText className="w-6 h-6 text-emerald-500" />} />
        <StatCard title="Denúncias" value={denuncias.length} icon={<AlertTriangle className="w-6 h-6 text-red-500" />} />
        <StatCard title="Aprovações" value={postagens.length} icon={<MessageSquare className="w-6 h-6 text-amber-500" />} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-slate-100 bg-red-50 flex items-center justify-between">
            <h3 className="font-bold text-red-800">Denúncias Pendentes</h3>
            <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{denuncias.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {denuncias.length === 0 && (
              <div className="p-6 text-center text-slate-500 font-medium text-sm">Nenhuma denúncia pendente.</div>
            )}
            {denuncias.map((post: any) => (
              <div key={post.id} className="p-5">
                <p className="text-sm font-bold text-slate-800 mb-1">{post.author_name}</p>
                {post.image && <img src={post.image} alt="Denúncia" className="w-full h-32 object-cover rounded-lg mb-3" />}
                <p className="text-[14px] text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">"{post.content}"</p>
                <div className="flex gap-2">
                  <button onClick={() => handleApprovePost(post.id, post.category)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs hover:bg-emerald-200 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                  </button>
                  <button onClick={() => handleRejectPost(post.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-bold text-xs hover:bg-red-200 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-amber-50 flex items-center justify-between">
              <h3 className="font-bold text-amber-800">Postagens Pendentes</h3>
              <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{postagens.length}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {postagens.length === 0 && (
                <div className="p-6 text-center text-slate-500 font-medium text-sm">Nenhuma postagem pendente.</div>
              )}
              {postagens.map((post: any) => (
                <div key={post.id} className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-slate-800">{post.author_name}</p>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{post.category}</span>
                  </div>
                  {post.image && <img src={post.image} alt="Postagem" className="w-full h-32 object-cover rounded-lg mb-3" />}
                  <p className="text-[14px] text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">"{post.content}"</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprovePost(post.id, post.category)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs hover:bg-emerald-200 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                    </button>
                    <button onClick={() => handleRejectPost(post.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-bold text-xs hover:bg-red-200 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function UsersTab() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const handleAvisar = (user: any) => {
    alert(`Mensagem de aviso simulada enviada para o WhatsApp ${user.whatsapp || 'não cadastrado'} do usuário ${user.name}.`);
  };

  const handleEditar = (user: any) => {
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      await supabase.from('profiles').update({
        name: editingUser.name,
        neighborhood: editingUser.neighborhood,
        address: editingUser.address,
        whatsapp: editingUser.whatsapp,
      }).eq('id', editingUser.id);
      setEditingUser(null);
      fetchUsers();
    }
  };

  const handleToggleStatus = async (user: any) => {
    const isPending = user.status === 'Pendente';
    const newStatus = (user.status === 'Ativo' || isPending) ? (isPending ? 'Ativo' : 'Bloqueado') : 'Ativo';
    const actionText = isPending ? 'aprovar' : (user.status === 'Ativo' ? 'bloquear' : 'liberar');
    
    if (confirm(`Tem certeza que deseja ${actionText} o usuário ${user.name}?`)) {
      await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (confirm(`Atenção: Tem certeza que deseja excluir a conta de ${user.name} permanentemente?`)) {
      await supabase.from('profiles').delete().eq('id', user.id);
      setSelectedUserId('');
      fetchUsers();
    }
  };

  const handleAcessarUsuario = (user: any) => {
    localStorage.setItem('impersonatedUser', JSON.stringify(user));
    navigate('/feed');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gerenciar Usuários</h2>
        <div className="bg-white border border-slate-200 rounded-full px-4 py-2 flex items-center shadow-sm">
          <span className="text-sm font-semibold text-slate-500">Total: {users.length} usuários</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">Selecione um usuário para administrar ou acessar:</label>
        <select 
          className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-medium"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">-- Selecione um usuário --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email || u.handle})</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {selectedUserId && users.filter(u => u.id === selectedUserId).map((user) => (
          <div key={user.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-blue-100 p-6 flex flex-col gap-6">
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-slate-200 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md">
                  <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.handle}`} alt={user.name} />
                </div>
                {user.status === 'Ativo' && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
                {user.status === 'Bloqueado' && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
                )}
                {user.status === 'Pendente' && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-amber-500 border-2 border-white rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-800 text-xl leading-none">{user.name}</p>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.status === 'Ativo' ? 'bg-emerald-100/80 text-emerald-700' : (user.status === 'Pendente' ? 'bg-amber-100/80 text-amber-700' : 'bg-red-100/80 text-red-700')}`}>
                    {user.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">{user.handle} • {user.email}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2 text-slate-600 text-sm">
                  <div className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <MessageSquare className="w-4 h-4" /> {user.whatsapp || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-slate-400" /> {user.neighborhood || 'Bairro não informado'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-100">
              <button onClick={() => handleAcessarUsuario(user)} className="col-span-2 sm:col-span-4 flex justify-center items-center gap-2 px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all mb-2">
                <LogOut className="w-5 h-5 rotate-180" /> Acessar Conta (Testar/Postar)
              </button>
              
              <button onClick={() => handleEditar(user)} className="flex justify-center items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-sm transition-all">
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => handleAvisar(user)} className="flex justify-center items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-sm transition-all">
                <Send className="w-4 h-4" /> Avisar
              </button>
              <button onClick={() => handleToggleStatus(user)} className={`flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${user.status === 'Pendente' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : (user.status === 'Ativo' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}`}>
                {user.status === 'Pendente' ? <CheckCircle className="w-4 h-4" /> : (user.status === 'Ativo' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />)} {user.status === 'Pendente' ? 'Aprovar' : (user.status === 'Ativo' ? 'Bloquear' : 'Liberar')}
              </button>
              <button onClick={() => handleDeleteUser(user)} className="flex justify-center items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-bold text-sm transition-all">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>

          </div>
        ))}
      </div>
      

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Editar Morador</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Bairro / Condomínio</label>
                <input 
                  type="text" 
                  value={editingUser.neighborhood || ''}
                  onChange={(e) => setEditingUser({...editingUser, neighborhood: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Endereço (Rua, Número)</label>
                <input 
                  type="text" 
                  value={editingUser.address || ''}
                  onChange={(e) => setEditingUser({...editingUser, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp</label>
                <input 
                  type="text" 
                  value={editingUser.whatsapp || ''}
                  onChange={(e) => setEditingUser({...editingUser, whatsapp: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AnnouncementsTab() {

  const [announcementText, setAnnouncementText] = useState('');
  const [bannedWords, setBannedWords] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const globalAviso = data.find((s: any) => s.key === 'global_announcement');
      if (globalAviso) setAnnouncementText(globalAviso.value);
      
      const banned = data.find((s: any) => s.key === 'banned_words');
      if (banned) setBannedWords(banned.value);
    }
  };

  const handleSaveAnnouncement = async () => {
    const { error } = await supabase.from('settings').upsert({
      key: 'global_announcement',
      value: announcementText
    }, { onConflict: 'key' });
    
    if (!error) {
      alert('Aviso Global publicado para todos os usuários com sucesso!');
    } else {
      alert('Erro ao publicar aviso: ' + error.message);
    }
  };

  const handleSaveBannedWords = async () => {
    const { error } = await supabase.from('settings').upsert({
      key: 'banned_words',
      value: bannedWords
    }, { onConflict: 'key' });
    
    if (!error) {
      alert('Filtro de palavras atualizado com sucesso!');
    } else {
      alert('Erro ao atualizar filtro: ' + error.message);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Mural e Configurações</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h3 className="font-bold text-slate-800 mb-2">Aviso Global</h3>
          <p className="text-slate-600 mb-4 text-sm">Escreva um aviso que ficará fixado no topo do Feed.</p>
          <textarea 
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="Ex: Alerta de segurança na região da praça principal..."
          ></textarea>
          <div className="flex justify-end items-center">
            <button onClick={handleSaveAnnouncement} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm">
              <Megaphone className="w-4 h-4" /> Fixar Aviso
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h3 className="font-bold text-slate-800 mb-2">Filtro de Palavras Proibidas</h3>
          <p className="text-slate-600 mb-4 text-sm">Para manter o respeito, defina palavras ofensivas separadas por vírgula. Postagens com elas serão barradas.</p>
          <textarea 
            value={bannedWords}
            onChange={(e) => setBannedWords(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="Ex: palavrão1, palavrão2, ofensa..."
          ></textarea>
          <div className="flex justify-end items-center">
            <button onClick={handleSaveBannedWords} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm">
              <Save className="w-4 h-4" /> Salvar Filtro
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function LandingConfigTab() {
  const [bgImage, setBgImage] = useState('');
  const [newsList, setNewsList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const getVal = (k: string) => data.find((s: any) => s.key === k)?.value;
      setBgImage(getVal('landing_bg_image') || 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80');
      
      const newsData = getVal('landing_news_list');
      let loadedValidArray = false;
      if (newsData) {
        try {
          const parsed = JSON.parse(newsData);
          if (Array.isArray(parsed)) {
            setNewsList(parsed.filter((n: any) => n && typeof n === 'object'));
            loadedValidArray = true;
          }
        } catch (e) {}
      } 
      
      if (!loadedValidArray) {
        // Fallback for migration
        setNewsList([
          { id: '1', title: getVal('landing_news_main_title') || 'Reunião de Segurança Comunitária define novas regras', image: getVal('landing_news_main_img') || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80', label: 'Destaque' },
          { id: '2', title: getVal('landing_news_side1_title') || 'Falta de Água na Rua 15 será resolvida amanhã', image: '', label: 'Aviso Urgente' },
          { id: '3', title: getVal('landing_news_side2_title') || 'Nova feira de rua aos domingos confirmada', image: '', label: 'Comunidade' }
        ].filter(n => n.title));
      }
    }
  };

  const handleAddNews = () => {
    if (newsList.length >= 10) return alert('Máximo de 10 notícias atingido.');
    setNewsList([...newsList, { id: Date.now().toString(), title: '', image: '', label: 'Notícia', city: 'Campinas - SP' }]);
  };

  const handleRemoveNews = (id: string) => {
    setNewsList(newsList.filter(n => n.id !== id));
  };

  const handleUpdateNews = (id: string, field: string, value: string) => {
    setNewsList(newsList.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...newsList];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setNewsList(newList);
  };

  const handleMoveDown = (index: number) => {
    if (index === newsList.length - 1) return;
    const newList = [...newsList];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setNewsList(newList);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Filtra notícias vazias para evitar salvar itens corrompidos no banco
    const cleanNewsList = newsList.filter(n => n && n.title && n.title.trim() !== '');

    const updates = [
      { key: 'landing_bg_image', value: bgImage },
      { key: 'landing_news_list', value: JSON.stringify(cleanNewsList) },
      // Salvando também as chaves antigas para manter compatibilidade até a parte 2
      { key: 'landing_news_main_img', value: cleanNewsList[0]?.image || '' },
      { key: 'landing_news_main_title', value: cleanNewsList[0]?.title || '' },
      { key: 'landing_news_side1_title', value: cleanNewsList[1]?.title || '' },
      { key: 'landing_news_side2_title', value: cleanNewsList[2]?.title || '' },
    ];
    
    for (const update of updates) {
      await supabase.from('settings').upsert(update, { onConflict: 'key' });
    }
    
    setSaving(false);
    alert('Configurações atualizadas! As 10 notícias foram salvas no banco. (O site continuará com o layout antigo até completarmos o Passo 2).');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Capa do Site</h2>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Save className="w-5 h-5" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 text-lg border-b border-slate-100 pb-2">Plano de Fundo</h3>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">URL da Imagem de Fundo (Colagem/Mosaico)</label>
            <input 
              type="text" 
              value={bgImage}
              onChange={(e) => setBgImage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              placeholder="https://exemplo.com/sua-imagem.jpg"
            />
            <p className="text-xs text-slate-500 mt-2">Dica: Use links diretos de imagens (.jpg, .png). O sistema aplicará um filtro escuro automaticamente sobre ela.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-lg">Notícias da Capa ({newsList.length}/10)</h3>
            <button 
              onClick={handleAddNews}
              disabled={newsList.length >= 10}
              className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              + Adicionar Notícia
            </button>
          </div>
          
          <div className="space-y-4">
            {newsList.map((news, index) => (
              <div key={news.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3 relative group">
                <div className="absolute top-2 right-2 flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => handleMoveUp(index)} 
                    disabled={index === 0} 
                    className="text-slate-400 hover:text-blue-500 p-1 disabled:opacity-30 disabled:hover:text-slate-400" 
                    title="Mover para cima"
                  >
                    <ArrowLeft className="w-4 h-4 rotate-90" />
                  </button>
                  <button 
                    onClick={() => handleMoveDown(index)} 
                    disabled={index === newsList.length - 1} 
                    className="text-slate-400 hover:text-blue-500 p-1 disabled:opacity-30 disabled:hover:text-slate-400" 
                    title="Mover para baixo"
                  >
                    <ArrowLeft className="w-4 h-4 -rotate-90" />
                  </button>
                  <div className="w-px bg-slate-200 mx-1"></div>
                  <button 
                    onClick={() => handleRemoveNews(news.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                    title="Remover Notícia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{index + 1}</span>
                  <span className="text-sm font-bold text-slate-700">{index === 0 ? 'Notícia Principal (Destaque)' : 'Notícia Secundária'}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Título</label>
                    <input 
                      type="text" 
                      value={news.title}
                      onChange={(e) => handleUpdateNews(news.id, 'title', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-medium text-sm"
                      placeholder="Ex: Falta de Água na Rua 15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Rótulo (ex: Destaque, Aviso)</label>
                    <input 
                      type="text" 
                      value={news.label}
                      onChange={(e) => handleUpdateNews(news.id, 'label', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-medium text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                    <label className="block text-sm font-bold text-blue-900 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        📍 Cidade da Notícia
                      </span>
                      <span className="text-xs font-normal text-slate-500">
                        (ex: Santa Bárbara d'Oeste, Campinas, Americana...)
                      </span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        list={`cities-list-${news.id}`}
                        value={news.city || ''}
                        onChange={(e) => handleUpdateNews(news.id, 'city', e.target.value)}
                        className="flex-1 bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 font-bold text-sm text-slate-800 outline-none"
                        placeholder="Digite ou escolha a cidade: Santa Bárbara d'Oeste, Campinas..."
                      />
                      <datalist id={`cities-list-${news.id}`}>
                        <option value="Santa Bárbara d'Oeste - SP" />
                        <option value="Campinas - SP" />
                        <option value="Americana - SP" />
                        <option value="Sumaré - SP" />
                        <option value="Hortolândia - SP" />
                        <option value="Nova Odessa - SP" />
                        <option value="Limeira - SP" />
                        <option value="Piracicaba - SP" />
                        <option value="Paulínia - SP" />
                        <option value="São Paulo - SP" />
                      </datalist>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateNews(news.id, 'city', "Santa Bárbara d'Oeste - SP")}
                          className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-300 transition-colors shadow-sm cursor-pointer"
                        >
                          📍 Santa Bárbara
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateNews(news.id, 'city', "Campinas - SP")}
                          className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-300 transition-colors shadow-sm cursor-pointer"
                        >
                          📍 Campinas
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">URL da Imagem {index > 0 && <span className="text-slate-400 font-normal">(Opcional)</span>}</label>
                    <input 
                      type="text" 
                      value={news.image}
                      onChange={(e) => handleUpdateNews(news.id, 'image', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-medium text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Texto / Resumo da Notícia</label>
                    <textarea 
                      value={news.description || ''}
                      onChange={(e) => handleUpdateNews(news.id, 'description', e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-medium text-sm resize-none"
                      placeholder="Digite o texto detalhado para leitura..."
                    />
                  </div>
                </div>
              </div>
            ))}

            {newsList.length === 0 && (
              <div className="text-center p-6 text-slate-500 text-sm font-medium">
                Nenhuma notícia adicionada. Clique em "+ Adicionar Notícia" para começar.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DeletionsTab() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase.from('deletion_requests').select('*').eq('status', 'Pendente');
    if (data) setRequests(data);
  };

  const handleDeleteUser = async (request: any) => {
    if (confirm(`Tem certeza que deseja processar a exclusão da conta de ${request.user_name}? Esta ação apagará todas as postagens, comentários, guias e pets relacionados e não pode ser desfeita.`)) {
      try {
        // Apagar todos os registros do usuário:
        await supabase.from('posts').delete().eq('author_name', request.user_name);
        await supabase.from('comments').delete().eq('author_name', request.user_name);
        
        if (request.user_whatsapp && request.user_whatsapp !== 'desconhecido') {
          await supabase.from('commercial_guide').delete().eq('whatsapp', request.user_whatsapp);
          await supabase.from('lost_pets').delete().eq('owner_whatsapp', request.user_whatsapp);
        }

        // Apagar da tabela profiles
        if (request.user_whatsapp && request.user_whatsapp !== 'desconhecido') {
           await supabase.from('profiles').delete().eq('email', request.user_whatsapp); 
        }

        // Marcar request como Excluída
        await supabase.from('deletion_requests').update({ status: 'Excluída' }).eq('id', request.id);

        alert('Conta e todos os dados vinculados excluídos com sucesso.');
        fetchRequests();
      } catch (e: any) {
        alert('Erro ao excluir dados: ' + e.message);
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Solicitações de Exclusão de Conta</h2>
      
      {requests.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500 font-medium">
          Nenhuma solicitação pendente no momento.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl p-5 border border-red-200 shadow-sm relative">
              <h3 className="font-bold text-slate-800 text-lg mb-1">{req.user_name}</h3>
              <p className="text-sm font-bold text-slate-600 mb-4">{req.user_whatsapp}</p>
              
              <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 pt-4">
                <button 
                  onClick={() => handleDeleteUser(req)} 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm w-full transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirmar Exclusão Total
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonetizationTab() {
  const [monetizationEnabled, setMonetizationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('settings').select('*').eq('key', 'monetization_enabled');
    if (data && data.length > 0) {
      setMonetizationEnabled(data[0].value === 'true');
    }
    setLoading(false);
  };

  const toggleMonetization = async () => {
    const newValue = !monetizationEnabled;
    const { error } = await supabase.from('settings').upsert({
      key: 'monetization_enabled',
      value: String(newValue)
    });
    if (!error) {
      setMonetizationEnabled(newValue);
      alert(`Monetização ${newValue ? 'ATIVADA' : 'DESATIVADA'} com sucesso!`);
    } else {
      alert('Erro ao salvar configuração.');
    }
  };

  if (loading) return <div>Carregando configurações...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Painel de Monetização</h2>
      <p className="text-slate-500 mb-8">Controle as taxas e cobranças de funcionalidades premium do portal.</p>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Status Global de Cobranças
              <span className={`px-2 py-1 rounded text-xs font-bold ${monetizationEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {monetizationEnabled ? 'ATIVADA' : 'DESATIVADA'}
              </span>
            </h3>
            <p className="text-sm text-slate-500 mt-1">Ao ativar, o sistema passa a exibir os indicativos de cobrança para novos anúncios e módulos premium.</p>
          </div>
          <button 
            onClick={toggleMonetization}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${monetizationEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${monetizationEnabled ? 'translate-x-9' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="opacity-50 pointer-events-none">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Configurações Futuras (Em breve)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
              <label className="block text-sm font-bold text-slate-700 mb-1">Taxa fixa por Venda/Troca (R$)</label>
              <input type="number" disabled value="5.00" className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 cursor-not-allowed" />
            </div>
            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
              <label className="block text-sm font-bold text-slate-700 mb-1">Anúncio Destaque no Mural (R$)</label>
              <input type="number" disabled value="15.00" className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 cursor-not-allowed" />
            </div>
            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
              <label className="block text-sm font-bold text-slate-700 mb-1">Empresa Destaque no Guia (R$ / mês)</label>
              <input type="number" disabled value="39.90" className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 cursor-not-allowed" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketplaceAdminTab() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSettings();
    fetchItems();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('marketplace_settings').select('*').eq('key', 'marketplace_enabled').single();
    if (data) {
      setIsEnabled(data.value === 'true');
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data: listingsData } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false });
    const { data: itemsData } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });

    const combined: any[] = [];
    const seen = new Set();

    if (listingsData) {
      listingsData.forEach(l => {
        seen.add(l.id || l.title);
        combined.push({
          id: l.id,
          title: l.title,
          description: l.description,
          price: l.price,
          condition: l.condition || 'Usado',
          accepts_trade: l.accepts_trade === true,
          type: l.accepts_trade ? 'Troca' : 'Venda',
          neighborhood: l.neighborhood || 'Bairro Local',
          whatsapp: l.whatsapp,
          seller_name: 'Usuário Cadastrado',
          image: l.image_url || l.image,
          status: l.status === 'sold' ? 'Vendido' : (l.status === 'paused' ? 'Pausado' : 'Ativo'),
          created_at: l.created_at,
          table: 'marketplace_listings'
        });
      });
    }

    if (itemsData) {
      itemsData.forEach(i => {
        if (!seen.has(i.id || i.title)) {
          combined.push({
            id: i.id,
            title: i.title,
            description: i.description,
            price: i.price,
            condition: i.condition || 'Usado',
            accepts_trade: i.type === 'Troca',
            type: i.type,
            neighborhood: i.neighborhood || 'Bairro Local',
            whatsapp: i.seller_whatsapp,
            seller_name: i.seller_name || 'Morador',
            image: i.image,
            status: i.status || 'Ativo',
            created_at: i.created_at,
            table: 'marketplace_items'
          });
        }
      });
    }

    setItems(combined);
    setLoading(false);
  };

  const handleDeleteItem = async (item: any) => {
    if (confirm(`Excluir permanentemente o anúncio "${item.title}"?`)) {
      if (item.table === 'marketplace_listings') {
        await supabase.from('marketplace_listings').delete().eq('id', item.id);
      }
      await supabase.from('marketplace_items').delete().eq('id', item.id);
      await supabase.from('marketplace_items').delete().eq('title', item.title);
      alert('Anúncio excluído com sucesso!');
      fetchItems();
    }
  };

  const handleToggleStatus = async (item: any) => {
    const nextStatus = item.status === 'Vendido' ? 'Ativo' : 'Vendido';
    if (item.table === 'marketplace_listings') {
      await supabase.from('marketplace_listings').update({ status: nextStatus === 'Ativo' ? 'approved' : 'sold' }).eq('id', item.id);
    }
    await supabase.from('marketplace_items').update({ status: nextStatus }).eq('id', item.id);
    fetchItems();
  };

  const toggleMarketplace = async () => {
    const actionText = isEnabled ? 'DESATIVAR' : 'ATIVAR';
    if (confirm(`Deseja realmente ${actionText} o Marketplace?\n\n${isEnabled ? 'O Marketplace ficará invisível para os usuários e novas publicações serão bloqueadas.\nNenhum anúncio ou dado será apagado.' : 'O Marketplace será disponibilizado para os usuários.'}`)) {
      const newValue = isEnabled ? 'false' : 'true';
      await supabase.from('marketplace_settings').update({ value: newValue }).eq('key', 'marketplace_enabled');
      setIsEnabled(!isEnabled);
      alert(`Marketplace ${!isEnabled ? 'ativado' : 'desativado'} com sucesso!`);
    }
  };

  if (isEnabled === null) return <div>Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Marketplace V2</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-4 h-4 rounded-full ${isEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}></div>
            <h3 className="font-bold text-xl text-slate-800">Status: {isEnabled ? '🟢 ATIVO' : '🔴 DESATIVADO'}</h3>
          </div>
          <p className="text-slate-600 text-sm max-w-md">
            Botão mestre. Quando desativado, toda a área do Marketplace some para o público, mas os dados permanecem intactos.
          </p>
        </div>
        <button 
          onClick={toggleMarketplace}
          className={`px-8 py-4 rounded-xl font-black text-lg shadow-lg transition-transform hover:scale-105 ${isEnabled ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'}`}
        >
          {isEnabled ? 'Desativar Marketplace' : 'Ativar Marketplace'}
        </button>
      </div>

      {/* RESUMO E ESTATÍSTICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Anúncios</p>
          <p className="text-2xl font-black text-slate-800">{items.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">🏷️ Vendas</p>
          <p className="text-2xl font-black text-blue-600">{items.filter(i => !i.accepts_trade && i.type !== 'Troca').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">🔄 Trocas</p>
          <p className="text-2xl font-black text-purple-600">{items.filter(i => i.accepts_trade || i.type === 'Troca').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">🟢 Ativos</p>
          <p className="text-2xl font-black text-emerald-600">{items.filter(i => i.status !== 'Vendido').length}</p>
        </div>
      </div>

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="w-full sm:w-80">
          <input 
            type="text" 
            placeholder="Buscar por título ou vendedor..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="Ativo">Apenas Ativos</option>
            <option value="Vendido">Apenas Vendidos</option>
          </select>
          <button 
            onClick={fetchItems} 
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* LISTAGEM DOS PRODUTOS GERENCIADOS PELO ADMIN */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold">Carregando anúncios do Marketplace...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {items
            .filter(item => {
              const matchesSearch = !search.trim() || 
                item.title?.toLowerCase().includes(search.toLowerCase()) || 
                item.seller_name?.toLowerCase().includes(search.toLowerCase()) ||
                item.neighborhood?.toLowerCase().includes(search.toLowerCase());
              const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
              return matchesSearch && matchesStatus;
            })
            .map(item => (
              <div key={item.id || item.title} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.accepts_trade || item.type === 'Troca' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.accepts_trade || item.type === 'Troca' ? '🔄 Troca' : '🏷️ Venda'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Vendido' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm truncate" title={item.title}>{item.title}</h4>
                    <p className="text-emerald-600 font-black text-sm mt-0.5">
                      {item.accepts_trade || item.type === 'Troca' ? 'Para Troca' : Number(item.price) > 0 ? `R$ ${Number(item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Grátis'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      📍 {item.neighborhood} • 👤 {item.seller_name}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {item.whatsapp && (
                    <a 
                      href={`https://wa.me/55${String(item.whatsapp).replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs text-emerald-600 font-bold hover:underline"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button 
                      onClick={() => handleToggleStatus(item)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${item.status === 'Vendido' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {item.status === 'Vendido' ? 'Reativar' : 'Marcar Vendido'}
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Anúncio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500 mb-6">
          Nenhum anúncio cadastrado no Marketplace ainda.
        </div>
      )}

      <div style={{ display: 'none' }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[200px] text-center">
          <Store className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-800 mb-2">Fase 2 em construção...</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Gestão de categorias, aprovação de anúncios pendentes e relatórios entrarão nesta área.
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminSecurityTab() {
  const [adminEmail, setAdminEmail] = useState(localStorage.getItem('admin_custom_email') || 'lucianoalkine@gmail.com');
  const [adminPassword, setAdminPassword] = useState(localStorage.getItem('admin_custom_password') || '14182171Lu@');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSavedSettings();
  }, []);

  const fetchSavedSettings = async () => {
    try {
      const { data: eData } = await supabase.from('marketplace_settings').select('*').eq('key', 'admin_email').single();
      if (eData && eData.value) setAdminEmail(eData.value);

      const { data: pData } = await supabase.from('marketplace_settings').select('*').eq('key', 'admin_password').single();
      if (pData && pData.value) setAdminPassword(pData.value);
    } catch (err) {
      console.log('Sem dados salvos em settings');
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanEmail = adminEmail.trim();
      const cleanPass = adminPassword.trim();

      localStorage.setItem('admin_custom_email', cleanEmail);
      localStorage.setItem('admin_custom_password', cleanPass);

      await supabase.from('marketplace_settings').upsert({
        key: 'admin_email',
        value: cleanEmail,
        description: 'E-mail do Administrador'
      }, { onConflict: 'key' });

      await supabase.from('marketplace_settings').upsert({
        key: 'admin_password',
        value: cleanPass,
        description: 'Senha do Administrador'
      }, { onConflict: 'key' });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      alert('Erro ao salvar credenciais: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Configurações da Conta do Administrador</h2>
          <p className="text-slate-500 text-sm">Altere o e-mail e a senha que você usa para acessar o painel /admin</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl mb-6 flex items-center gap-3 shadow-sm">
          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">Credenciais Atualizadas com Sucesso!</p>
            <p className="text-xs text-emerald-700">Seu novo e-mail e senha de administrador já estão salvos e ativos para login no /admin.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-xl">
        <form onSubmit={handleSaveCredentials} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> E-mail do Administrador
            </label>
            <input 
              type="email" 
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-600 focus:bg-white font-medium transition-colors"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Este e-mail será usado para acessar a rota `/admin`.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" /> Nova Senha de Administrador
            </label>
            <input 
              type="text" 
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-600 focus:bg-white font-bold transition-colors"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Digite a nova senha desejada para o acesso do administrador.</p>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-base py-3.5 rounded-2xl transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Salvando Alterações...' : '💾 Salvar Novo E-mail e Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
