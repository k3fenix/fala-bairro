import { useState, useEffect } from 'react';
import { MapPin, Image as ImageIcon, ChevronDown, Heart, ThumbsUp, ThumbsDown, MessageCircle, Megaphone, LogOut, User, Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trash2, Send } from 'lucide-react';

export default function Feed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('Meu bairro');
  const [postContent, setPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [globalAnnouncement, setGlobalAnnouncement] = useState('');
  
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || 'Anônimo');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('user_avatar') || `https://i.pravatar.cc/150?u=${userName}`);
  const registeredNeighborhood = localStorage.getItem('user_neighborhood') || 'Vila Rica';
  
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editAvatar, setEditAvatar] = useState(userAvatar);

  const baseNeighborhoods = ['Vila Rica', 'Centro', 'Jardim Botânico', 'Bela Vista', 'Nova Esperança'];
  const [allNeighborhoods, setAllNeighborhoods] = useState<string[]>(baseNeighborhoods);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(registeredNeighborhood);

  useEffect(() => {
    if (localStorage.getItem('user_auth') !== 'true') {
      navigate('/');
      return;
    }
    
    fetchSettings();
    fetchUserData();
    fetchPosts();
  }, [navigate]);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const announcement = data.find(s => s.key === 'global_announcement');
      if (announcement && announcement.value) {
        setGlobalAnnouncement(announcement.value);
      }
    }
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        if (profile.status === 'Bloqueado') {
          alert('Sua conta foi bloqueada pelo administrador por violações das regras do bairro.');
          handleLogout();
        }
        setUserName(profile.name);
        setUserAvatar(profile.avatar);
        setEditName(profile.name);
        setEditAvatar(profile.avatar);
      }
    }
    
    const { data: profiles } = await supabase.from('profiles').select('neighborhood');
    if (profiles) {
      const neighborhoods = Array.from(new Set([...baseNeighborhoods, ...profiles.map(p => p.neighborhood).filter(Boolean)]));
      setAllNeighborhoods(neighborhoods);
    }
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) {
      setPosts(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user_auth');
    localStorage.removeItem('user_name');
    navigate('/');
  };

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        name: editName,
        avatar: editAvatar,
        handle: `@${editName.toLowerCase().replace(/\s+/g, '')}`
      }).eq('id', user.id);
      
      setUserName(editName);
      setUserAvatar(editAvatar);
      localStorage.setItem('user_name', editName);
      localStorage.setItem('user_avatar', editAvatar);
      
      setShowProfile(false);
      alert('Perfil atualizado com sucesso!');
      fetchPosts();
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!postContent.trim() && !selectedMedia) return;
    
    const createNewPost = async (imgUrl: string | null = null) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.from('posts').insert([
        {
          author_id: user.id,
          author_name: userName,
          author_avatar: userAvatar,
          handle: `@${userName.toLowerCase().replace(/\s+/g, '')}`,
          category: "Geral",
          neighborhood: selectedNeighborhood,
          content: postContent,
          image: imgUrl,
          is_pending: true,
          is_approved: false
        }
      ]);
      
      if (!error) {
        alert(`Sua publicação foi enviada para análise e já aparece para você como 'Ainda não aprovado'.`);
        setPostContent('');
        setSelectedMedia(null);
        fetchPosts();
      } else {
        alert('Erro ao publicar: ' + error.message);
      }
    };

    if (selectedMedia) {
      const reader = new FileReader();
      reader.onloadend = () => createNewPost(reader.result as string);
      reader.readAsDataURL(selectedMedia);
    } else {
      createNewPost(null);
    }
  };

  let filteredPosts = posts.filter((p: any) => p.is_approved || p.author_name === userName);

  if (activeFilter === 'Meu bairro') {
    filteredPosts = filteredPosts.filter((p: any) => p.neighborhood === selectedNeighborhood);
  } else if (activeFilter === 'Em alta') {
    filteredPosts.sort((a: any, b: any) => {
      const aScore = (a.likes || 0) + (a.upvotes || 0);
      const bScore = (b.likes || 0) + (b.upvotes || 0);
      return bScore - aScore;
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white sticky top-0 z-40 shadow-sm px-4 pt-4 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div className="relative flex items-center bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <MapPin className="w-4 h-4 text-blue-600 absolute left-3 pointer-events-none" />
            <select 
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="pl-8 pr-8 py-1.5 bg-transparent font-bold text-slate-800 text-sm appearance-none cursor-pointer outline-none w-36"
            >
              {allNeighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowProfile(true)} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors">
              <User className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Perfil</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['Meu bairro', 'Todos', 'Mais recentes', 'Em alta'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeFilter === filter ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {globalAnnouncement && (
        <div className="max-w-md mx-auto md:max-w-2xl px-4 mt-6 mb-4">
          <div className="relative overflow-hidden rounded-3xl shadow-[0_8px_30px_rgb(59,130,246,0.25)] border border-blue-400/20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent"></div>
            
            <div className="relative z-10 flex gap-4 items-center">
              <div className="bg-white/20 p-3 rounded-2xl shrink-0 backdrop-blur-md shadow-inner">
                <Megaphone className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                  </span>
                  <h4 className="font-extrabold text-[13px] uppercase tracking-widest text-blue-100">Aviso Oficial</h4>
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-white/95">
                  {globalAnnouncement}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl relative">
            <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Meu Perfil</h3>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full overflow-hidden mb-2 relative group shadow-md">
                <img src={editAvatar} alt="Profile" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <p className="text-[12px] font-medium text-slate-500">Clique na foto para alterar</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Seu Nome</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <button onClick={handleSaveProfile} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md">
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-4 mb-2 shadow-sm border-b border-slate-100">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden shrink-0">
            <img src={userAvatar} alt="User" />
          </div>
          <div className="flex-1">
            <textarea 
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Conte para o bairro o que aconteceu..."
              className="w-full bg-slate-50 text-slate-800 p-3 rounded-2xl mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px]"
            ></textarea>
            
            {selectedMedia && (
              <div className="mb-3 bg-blue-50 text-blue-700 text-sm p-2 rounded-lg flex items-center justify-between border border-blue-100">
                <span className="truncate font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> {selectedMedia.name}
                </span>
                <button onClick={() => setSelectedMedia(null)} className="text-blue-500 hover:text-blue-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex gap-4 text-slate-500">
                <label className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setSelectedMedia(e.target.files[0])} />
                </label>
              </div>
              <button 
                onClick={handlePublish}
                disabled={!postContent.trim() && !selectedMedia}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                PUBLICAR
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto md:max-w-2xl">
        {filteredPosts.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
        {filteredPosts.length === 0 && (
          <div className="text-center text-slate-500 py-10">
            Nenhuma publicação encontrada para este filtro.
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);

  const [likes, setLikes] = useState(post.likes || 0);
  const [upvotes, setUpvotes] = useState(post.upvotes || 0);
  const [downvotes, setDownvotes] = useState(post.downvotes || 0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const userName = localStorage.getItem('user_name') || 'Anônimo';
  const isAdmin = localStorage.getItem('admin_auth') === 'true';

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const updatePostCounts = async (updates: any) => {
    await supabase.from('posts').update(updates).eq('id', post.id);
  };

  const handleLike = () => {
    const newLikes = liked ? likes - 1 : likes + 1;
    setLikes(newLikes);
    setLiked(!liked);
    updatePostCounts({ likes: newLikes });
  };

  const handleUpvote = () => {
    let newUpvotes = upvotes;
    let newDownvotes = downvotes;
    if (upvoted) newUpvotes--;
    else {
      newUpvotes++;
      if (downvoted) {
        newDownvotes--;
        setDownvoted(false);
      }
    }
    setUpvotes(newUpvotes);
    setDownvotes(newDownvotes);
    setUpvoted(!upvoted);
    updatePostCounts({ upvotes: newUpvotes, downvotes: newDownvotes });
  };

  const handleDownvote = () => {
    let newDownvotes = downvotes;
    let newUpvotes = upvotes;
    if (downvoted) newDownvotes--;
    else {
      newDownvotes++;
      if (upvoted) {
        newUpvotes--;
        setUpvoted(false);
      }
    }
    setDownvotes(newDownvotes);
    setUpvotes(newUpvotes);
    setDownvoted(!downvoted);
    updatePostCounts({ upvotes: newUpvotes, downvotes: newDownvotes });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const text = newComment.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const { data } = await supabase.from('comments').insert([
      { post_id: post.id, author_name: userName, text }
    ]).select();
    
    if (data && data[0]) {
      setComments([...comments, data[0]]);
      setNewComment('');
    }
  };

  const handleDeleteComment = async (cid: number) => {
    await supabase.from('comments').delete().eq('id', cid);
    setComments(comments.filter(c => c.id !== cid));
  };

  return (
    <div className="bg-white mb-2 md:mb-4 p-4 shadow-sm md:rounded-2xl md:border md:border-slate-100">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden shrink-0">
            <img src={post.author_avatar || `https://i.pravatar.cc/150?u=${post.handle}`} alt={post.author_name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-800 leading-tight">{post.author_name}</p>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {post.category}
              </span>
              {post.is_pending && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md uppercase tracking-wide border border-amber-200">
                  Ainda não aprovado
                </span>
              )}
              {post.is_approved && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md uppercase tracking-wide border border-emerald-200">
                  Aprovada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{post.handle}</p>
          </div>
        </div>
      </div>

      <p className="text-slate-800 mb-3 text-[15px] leading-relaxed">
        {post.content}
      </p>

      {post.image && (
        <div className="w-full bg-slate-100 rounded-xl mb-4 overflow-hidden max-h-80 relative">
          <img 
            src={post.image} 
            alt="Post content"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex justify-between items-center text-slate-500 pt-2 border-t border-slate-50">
        <div className="flex gap-6">
          <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors group ${liked ? 'text-red-500' : 'hover:text-red-500'}`}>
            <Heart className={`w-5 h-5 transition-transform ${liked ? 'fill-red-500 scale-110' : 'group-hover:fill-red-500'}`} />
            <span className="text-sm font-medium">{likes}</span>
          </button>
          <button onClick={handleUpvote} className={`flex items-center gap-1.5 transition-colors ${upvoted ? 'text-blue-600' : 'hover:text-blue-600'}`}>
            <ThumbsUp className={`w-5 h-5 transition-transform ${upvoted ? 'fill-blue-600 scale-110' : ''}`} />
            <span className="text-sm font-medium">{upvotes}</span>
          </button>
          <button onClick={handleDownvote} className={`flex items-center gap-1.5 transition-colors ${downvoted ? 'text-slate-800' : 'hover:text-slate-800'}`}>
            <ThumbsDown className={`w-5 h-5 transition-transform ${downvoted ? 'fill-slate-800 scale-110' : ''}`} />
            <span className="text-sm font-medium">{downvotes}</span>
          </button>
        </div>
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 transition-colors ${showComments ? 'text-blue-600' : 'hover:text-blue-500'}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comentar</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="space-y-3 mb-4">
            {comments.map((c: any) => {
              const isMine = c.author_name === userName;
              return (
                <div key={c.id} className="bg-slate-50 p-3 rounded-xl flex gap-3 group">
                  <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden shrink-0">
                    <img src={`https://i.pravatar.cc/150?u=${c.author_name}`} alt={c.author_name} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm text-slate-800">{c.author_name}</p>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(isMine || isAdmin) && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{c.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 rounded-full px-4 py-2 text-sm disabled:opacity-50"
            />
            <button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
