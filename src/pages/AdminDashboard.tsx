import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, AlertTriangle, MessageSquare, LogOut, Ban, Edit, Trash2, Send, Megaphone, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

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
      {/* Topbar */}
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
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-4 gap-2">
          <TabButton icon={<AlertTriangle />} label="Visão Geral" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <TabButton icon={<Users />} label="Gerenciar Usuários" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabButton icon={<Megaphone />} label="Mural de Avisos" active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 max-w-6xl">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'announcements' && <AnnouncementsTab />}
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
  const [reports, setReports] = useState([
    { id: 1, author: '@usuario_suspeito', reason: 'Conteúdo ofensivo. Reportado por 3 pessoas.', postContent: 'Vocês são todos um bando de idiotas, não sabem resolver nada nesse bairro!' },
    { id: 2, author: '@vendedor_spam', reason: 'Spam comercial repetitivo. Reportado por 5 pessoas.', postContent: 'COMPRE AGORA! PROMOÇÃO IMPERDÍVEL SÓ HOJE! ACESSE: link_estranho.com/vendas' }
  ]);

  const [allPosts, setAllPosts] = useState(() => {
    return JSON.parse(localStorage.getItem('fala_bairro_posts') || '[]');
  });
  
  const pendingPosts = allPosts.filter((p: any) => p.isPending);

  const [pendingDeletions, setPendingDeletions] = useState([
    { id: 1, author: 'Pedro Alves', reason: 'Me mudei de bairro e não vou mais usar.' }
  ]);

  const handleDeletePost = (id: number) => {
    alert('Publicação excluída com sucesso.');
    setReports(reports.filter(r => r.id !== id));
  };

  const handleBanUserFromReport = (id: number, author: string) => {
    if (confirm(`Atenção: Tem certeza que deseja bloquear permanentemente o usuário ${author} e excluir esta postagem?`)) {
      setReports(reports.filter(r => r.id !== id));
      
      const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      const updatedUsers = allUsers.map((u: any) => u.name === author ? { ...u, status: 'Bloqueado' } : u);
      localStorage.setItem('all_users', JSON.stringify(updatedUsers));
      
      const updatedPosts = allPosts.filter((p: any) => p.author !== author);
      localStorage.setItem('fala_bairro_posts', JSON.stringify(updatedPosts));
      setAllPosts(updatedPosts);

      alert(`Usuário ${author} bloqueado com sucesso e postagens removidas.`);
    }
  };

  const handleIgnoreReport = (id: number) => {
    setReports(reports.filter(r => r.id !== id));
  };

  const handleApprovePost = (id: number) => {
    const updated = allPosts.map((p: any) => p.id === id ? { ...p, isPending: false, isApproved: true } : p);
    setAllPosts(updated);
    localStorage.setItem('fala_bairro_posts', JSON.stringify(updated));
    alert('Postagem aprovada e enviada para o Feed.');
  };

  const handleRejectPost = (id: number) => {
    const updated = allPosts.filter((p: any) => p.id !== id);
    setAllPosts(updated);
    localStorage.setItem('fala_bairro_posts', JSON.stringify(updated));
  };

  const handleApproveDeletion = (id: number) => {
    const req = pendingDeletions.find(d => d.id === id);
    if (req) {
      const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      localStorage.setItem('all_users', JSON.stringify(allUsers.filter((u: any) => u.name !== req.author)));
      
      const updatedPosts = allPosts.filter((p: any) => p.author !== req.author);
      localStorage.setItem('fala_bairro_posts', JSON.stringify(updatedPosts));
      setAllPosts(updatedPosts);
    }
    setPendingDeletions(pendingDeletions.filter(d => d.id !== id));
    alert('Conta e publicações do usuário excluídas definitivamente.');
  };

  const handleRejectDeletion = (id: number) => {
    setPendingDeletions(pendingDeletions.filter(d => d.id !== id));
    alert('A exclusão foi rejeitada. A conta continua ativa.');
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Visão Geral</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Usuários" value="1,248" icon={<Users className="w-6 h-6 text-blue-500" />} />
        <StatCard title="Publicações" value="3,842" icon={<FileText className="w-6 h-6 text-emerald-500" />} />
        <StatCard title="Denúncias" value={reports.length} icon={<AlertTriangle className="w-6 h-6 text-red-500" />} />
        <StatCard title="Aprovações" value={pendingPosts.length + pendingDeletions.length} icon={<MessageSquare className="w-6 h-6 text-amber-500" />} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Denúncias */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-700">Denúncias Recentes</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.length === 0 && (
              <div className="p-6 text-center text-slate-500 font-medium text-sm">Nenhuma denúncia no momento.</div>
            )}
            {reports.map((report) => (
              <div key={report.id} className="p-5 flex flex-col gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-1">Publicação de <span className="text-blue-600">{report.author}</span></p>
                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 mb-3 relative">
                    <div className="absolute -left-1 top-4 w-2 h-8 bg-slate-300 rounded-r-md"></div>
                    <p className="text-[14px] text-slate-700 italic pl-2">"{report.postContent}"</p>
                  </div>
                  <p className="text-[13px] font-semibold text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Motivo: {report.reason}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full mt-1">
                  <button onClick={() => handleDeletePost(report.id)} className="flex-1 min-w-[120px] px-3 py-2 bg-red-100 text-red-700 rounded-lg font-bold text-xs hover:bg-red-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <Trash2 className="w-3.5 h-3.5" /> Excluir Post
                  </button>
                  <button onClick={() => handleBanUserFromReport(report.id, report.author)} className="flex-1 min-w-[120px] px-3 py-2 bg-amber-100 text-amber-800 rounded-lg font-bold text-xs hover:bg-amber-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <Ban className="w-3.5 h-3.5" /> Bloquear Usuário
                  </button>
                  <button onClick={() => handleIgnoreReport(report.id)} className="flex-1 min-w-[120px] px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5" /> Ignorar Denúncia
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Aprovações */}
        <div className="space-y-6">
          {/* Aprovação de Posts */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-amber-50">
              <h3 className="font-bold text-amber-800">Postagens Pendentes</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingPosts.length === 0 && (
                <div className="p-6 text-center text-slate-500 font-medium text-sm">Nenhuma postagem pendente.</div>
              )}
              {pendingPosts.map(post => (
                <div key={post.id} className="p-5">
                  <p className="text-sm font-bold text-slate-800 mb-1">{post.author}</p>
                  <p className="text-[14px] text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg italic">"{post.content}"</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprovePost(post.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs hover:bg-emerald-200 transition-colors">
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

          {/* Exclusão de Contas */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-red-50">
              <h3 className="font-bold text-red-800">Solicitações de Exclusão de Conta</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingDeletions.length === 0 && (
                <div className="p-6 text-center text-slate-500 font-medium text-sm">Nenhuma solicitação pendente.</div>
              )}
              {pendingDeletions.map(req => (
                <div key={req.id} className="p-5">
                  <p className="text-sm font-bold text-slate-800 mb-1">{req.author}</p>
                  <p className="text-[13px] text-slate-500 mb-3">Motivo: {req.reason}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveDeletion(req.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir Conta
                    </button>
                    <button onClick={() => handleRejectDeletion(req.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors">
                      Manter Conta
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
  const [users, setUsers] = useState(() => {
    const mockUsers = [
      { id: 1, name: 'João Silva', handle: '@joaosilva', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=@joaosilva', whatsapp: '(11) 98765-4321' },
      { id: 2, name: 'Marcos Almeida', handle: '@marcos_a', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=@marcos_a', whatsapp: '(21) 99999-1111' },
      { id: 3, name: 'Spam Bot 3000', handle: '@promo_bot', status: 'Bloqueado', avatar: 'https://i.pravatar.cc/150?u=@promo_bot', whatsapp: '(31) 90000-0000' },
    ];
    const registered = JSON.parse(localStorage.getItem('all_users') || '[]');
    const combined = [...registered, ...mockUsers];
    return Array.from(new Map(combined.map(item => [item.name, item])).values());
  });

  const handleAvisar = (user: any) => {
    alert(`Mensagem de aviso simulada enviada para o WhatsApp ${user.whatsapp} do usuário ${user.name}.`);
  };

  const handleEditar = (user: any) => {
    const newName = prompt(`Digite o novo nome para ${user.name}:`, user.name);
    if (newName && newName.trim()) {
      const updated = users.map(u => u.id === user.id ? { ...u, name: newName } : u);
      setUsers(updated);
      localStorage.setItem('all_users', JSON.stringify(updated));
      
      const posts = JSON.parse(localStorage.getItem('fala_bairro_posts') || '[]');
      const updatedPosts = posts.map((p: any) => p.author === user.name ? { ...p, author: newName, handle: `@${newName.toLowerCase().replace(/\s+/g, '')}` } : p);
      localStorage.setItem('fala_bairro_posts', JSON.stringify(updatedPosts));
    }
  };

  const handleToggleStatus = (user: any) => {
    const newStatus = user.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
    if (confirm(`Tem certeza que deseja mudar o status de ${user.name} para ${newStatus}?`)) {
      const updated = users.map(u => u.id === user.id ? { ...u, status: newStatus } : u);
      setUsers(updated);
      localStorage.setItem('all_users', JSON.stringify(updated));
    }
  };

  const handleDeleteUser = (id: number, name: string) => {
    if (confirm(`Atenção: Tem certeza que deseja excluir a conta de ${name} permanentemente? Suas publicações também serão apagadas.`)) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('all_users', JSON.stringify(updated));
      
      const posts = JSON.parse(localStorage.getItem('fala_bairro_posts') || '[]');
      const updatedPosts = posts.filter((p: any) => p.author !== name);
      localStorage.setItem('fala_bairro_posts', JSON.stringify(updatedPosts));
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gerenciar Usuários</h2>
        <div className="bg-white border border-slate-200 rounded-full px-4 py-2 flex items-center shadow-sm">
          <span className="text-sm font-semibold text-slate-500">Total: {users.length} usuários</span>
        </div>
      </div>

      <div className="grid gap-4">
        {users.length === 0 && (
          <div className="p-6 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">
            Nenhum usuário cadastrado.
          </div>
        )}
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-5 hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-slate-200 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md">
                  <img src={user.avatar} alt={user.name} />
                </div>
                {user.status === 'Ativo' && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
                {user.status === 'Bloqueado' && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-slate-800 text-lg leading-none">{user.name}</p>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.status === 'Ativo' ? 'bg-emerald-100/80 text-emerald-700' : 'bg-red-100/80 text-red-700'}`}>
                    {user.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">{user.handle}</p>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{user.whatsapp}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto bg-slate-50/50 p-1.5 rounded-xl border border-slate-100">
              <button onClick={() => handleAvisar(user)} className="flex-1 md:flex-none flex justify-center items-center gap-1.5 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg font-bold text-[13px] shadow-sm transition-all">
                <Send className="w-4 h-4" /> Avisar
              </button>
              <button onClick={() => handleEditar(user)} className="flex-1 md:flex-none flex justify-center items-center gap-1.5 px-4 py-2 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg font-bold text-[13px] shadow-sm transition-all">
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => handleToggleStatus(user)} className={`flex-1 md:flex-none flex justify-center items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-[13px] shadow-sm transition-all ${user.status === 'Ativo' ? 'text-amber-600 hover:bg-amber-50 hover:border-amber-200' : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`}>
                <Ban className="w-4 h-4" /> {user.status === 'Ativo' ? 'Bloquear' : 'Liberar'}
              </button>
              <button onClick={() => handleDeleteUser(user.id, user.name)} className="flex-1 md:flex-none flex justify-center items-center gap-1.5 px-4 py-2 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg font-bold text-[13px] shadow-sm transition-all">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>

          </div>
        ))}
      </div>
    </>
  );
}

function AnnouncementsTab() {
  const [commentLimit, setCommentLimit] = useState(localStorage.getItem('max_comments_per_post') || '3');

  const baseNeighborhoods = ['Vila Rica', 'Centro', 'Jardim Botânico', 'Bela Vista', 'Nova Esperança'];
  const [allNeighborhoods] = useState(() => {
    const users = JSON.parse(localStorage.getItem('all_users') || '[]');
    const userNeighborhoods = users.map((u: any) => u.neighborhood).filter(Boolean);
    return Array.from(new Set([...baseNeighborhoods, ...userNeighborhoods]));
  });

  const handleSaveLimit = () => {
    localStorage.setItem('max_comments_per_post', commentLimit);
    alert('Limite de comentários atualizado com sucesso!');
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Mural e Configurações</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aviso Global */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-2">Aviso Global</h3>
          <p className="text-slate-600 mb-4 text-sm">Escreva um aviso que ficará fixado no topo do Feed.</p>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="Ex: Alerta de segurança na região da praça principal..."
          ></textarea>
          <div className="flex justify-between items-center">
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:outline-none text-sm">
              <option>Todos os bairros</option>
              {allNeighborhoods.map(n => <option key={n}>{n}</option>)}
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm">
              <Megaphone className="w-4 h-4" /> Fixar Aviso
            </button>
          </div>
        </div>

        {/* Configurações de Comentários */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-2">Limite de Comentários</h3>
          <p className="text-slate-600 mb-4 text-sm">Para evitar brigas, defina quantos comentários um usuário pode fazer por publicação.</p>
          
          <div className="flex items-center gap-4 mb-4">
            <input 
              type="number" 
              min="1"
              value={commentLimit}
              onChange={(e) => setCommentLimit(e.target.value)}
              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg text-center"
            />
            <span className="text-slate-600 font-medium">comentários por pessoa</span>
          </div>

          <button 
            onClick={handleSaveLimit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
          >
            Salvar Limite
          </button>
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

