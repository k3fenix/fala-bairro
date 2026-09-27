import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, AlertTriangle, MessageSquare, LogOut, Ban, Edit, Trash2, Send, Megaphone, ArrowLeft, CheckCircle, XCircle, LayoutDashboard, Save } from 'lucide-react';
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
        <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-4 gap-2">
          <TabButton icon={<AlertTriangle />} label="Visão Geral" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <TabButton icon={<Users />} label="Gerenciar Usuários" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabButton icon={<Megaphone />} label="Mural de Avisos" active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />
          <TabButton icon={<LayoutDashboard />} label="Capa do Site" active={activeTab === 'landing'} onClick={() => setActiveTab('landing')} />
        </div>

        <div className="flex-1 p-6 max-w-6xl">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
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
    const isDenuncia = currentCategory.includes('Denúncia');
    
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
    const newStatus = user.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
    const actionText = user.status === 'Ativo' ? 'bloquear' : 'liberar';
    
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
              <button onClick={() => handleToggleStatus(user)} className={`flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${user.status === 'Ativo' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                {user.status === 'Ativo' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />} {user.status === 'Ativo' ? 'Bloquear' : 'Liberar'}
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
  const [config, setConfig] = useState({
    bgImage: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80',
    newsImg: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80',
    newsMain: 'Reunião de Segurança Comunitária define novas regras',
    newsSide1: 'Falta de Água na Rua 15 será resolvida amanhã',
    newsSide2: 'Nova feira de rua aos domingos confirmada'
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const getVal = (k: string) => data.find((s: any) => s.key === k)?.value;
      setConfig(prev => ({
        bgImage: getVal('landing_bg_image') || prev.bgImage,
        newsImg: getVal('landing_news_main_img') || prev.newsImg,
        newsMain: getVal('landing_news_main_title') || prev.newsMain,
        newsSide1: getVal('landing_news_side1_title') || prev.newsSide1,
        newsSide2: getVal('landing_news_side2_title') || prev.newsSide2,
      }));
    }
  };

  const handleChange = (e: any) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = [
      { key: 'landing_bg_image', value: config.bgImage },
      { key: 'landing_news_main_img', value: config.newsImg },
      { key: 'landing_news_main_title', value: config.newsMain },
      { key: 'landing_news_side1_title', value: config.newsSide1 },
      { key: 'landing_news_side2_title', value: config.newsSide2 },
    ];
    
    for (const update of updates) {
      await supabase.from('settings').upsert(update, { onConflict: 'key' });
    }
    
    setSaving(false);
    alert('Configurações da Landing Page atualizadas com sucesso!');
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
              name="bgImage"
              value={config.bgImage}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              placeholder="https://exemplo.com/sua-imagem.jpg"
            />
            <p className="text-xs text-slate-500 mt-2">Dica: Use links diretos de imagens (.jpg, .png). O sistema aplicará um filtro escuro automaticamente sobre ela.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 text-lg border-b border-slate-100 pb-2">Notícia em Destaque</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">URL da Imagem da Notícia</label>
              <input 
                type="text" 
                name="newsImg"
                value={config.newsImg}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Título da Notícia Principal</label>
              <input 
                type="text" 
                name="newsMain"
                value={config.newsMain}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 text-lg border-b border-slate-100 pb-2">Notícias Laterais (Textos)</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Título da Notícia Lateral 1 (Aviso Urgente)</label>
              <input 
                type="text" 
                name="newsSide1"
                value={config.newsSide1}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Título da Notícia Lateral 2 (Comunidade)</label>
              <input 
                type="text" 
                name="newsSide2"
                value={config.newsSide2}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
