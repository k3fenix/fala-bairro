import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, AlertTriangle, MessageSquare, LogOut, Ban, Edit, Trash2, Send, Megaphone, ArrowLeft, CheckCircle, XCircle, LayoutDashboard, Save, Store, Plus } from 'lucide-react';
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
          <TabButton icon={<LayoutDashboard />} label="Capa do Site" active={activeTab === 'landing'} onClick={() => setActiveTab('landing')} />
        </div>

        <div className="flex-1 p-6 max-w-6xl overflow-y-auto">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'commercial' && <CommercialTab />}
          {activeTab === 'pets' && <PetsTab />}
          {activeTab === 'announcements' && <AnnouncementsTab />}
          {activeTab === 'landing' && <LandingConfigTab />}
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
      neighborhood: formData.get('neighborhood'),
      rating: Number(formData.get('rating') || 5),
      is_verified: formData.get('is_verified') === 'on',
    };

    if (editing?.id) {
      await supabase.from('commercial_guide').update(item).eq('id', editing.id);
    } else {
      await supabase.from('commercial_guide').insert([item]);
    }
    setEditing(null);
    fetchItems();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Guia Comercial</h2>
        <button onClick={() => setEditing({})} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Adicionar Comércio
        </button>
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
            <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
            <textarea name="description" defaultValue={editing.description} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 h-20"></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp (apenas números)</label>
            <input name="whatsapp" defaultValue={editing.whatsapp} required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2" />
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
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative">
            <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
            <p className="text-sm font-bold text-emerald-600 mb-2">{item.category}</p>
            <p className="text-sm text-slate-600 mb-4">{item.whatsapp}</p>
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
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Visão Geral</h2>
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
    setNewsList([...newsList, { id: Date.now().toString(), title: '', image: '', label: 'Notícia' }]);
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
