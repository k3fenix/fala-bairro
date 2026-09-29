import { useState, useEffect } from 'react';
import { MapPin, Image as ImageIcon, ChevronDown, Heart, ThumbsUp, ThumbsDown, MessageCircle, Megaphone, LogOut, User, Camera, X, Share2, AlertTriangle, Store, Dog, MoreHorizontal, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trash2, Send } from 'lucide-react';

export default function Feed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('Meu bairro');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('Postagem');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [globalAnnouncement, setGlobalAnnouncement] = useState('');
  
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || 'Anônimo');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('user_avatar') || `https://i.pravatar.cc/150?u=${userName}`);
  const [showProfile, setShowProfile] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showPetsModal, setShowPetsModal] = useState(false);
  const [_profileTab, _setProfileTab] = useState('pessoal');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessWhatsapp, setBusinessWhatsapp] = useState('');
  const [businessImage, setBusinessImage] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('');
  const [petDescription, setPetDescription] = useState('');
  const [petLocation, setPetLocation] = useState('');
  const [petWhatsapp, setPetWhatsapp] = useState('');
  const [petStatus, setPetStatus] = useState('Perdido');
  const [petImage, setPetImage] = useState<string | null>(null);

  const [editName, setEditName] = useState(userName);
  const [editAvatar, setEditAvatar] = useState(userAvatar);

  const baseNeighborhoods = ['Vila Rica', 'Centro', 'Jardim Botânico', 'Bela Vista', 'Nova Esperança'];
  const [allNeighborhoods, setAllNeighborhoods] = useState<string[]>(baseNeighborhoods);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(localStorage.getItem('user_neighborhood') || 'Vila Rica');
  const [allPets, setAllPets] = useState<any[]>([]);
  const [myBusinesses, setMyBusinesses] = useState<any[]>([]);
  const [myPets, setMyPets] = useState<any[]>([]);

  useEffect(() => {
    const isImpersonating = !!localStorage.getItem('impersonatedUser');
    if (!isImpersonating && localStorage.getItem('user_auth') !== 'true') {
      navigate('/');
      return;
    }
    
    fetchSettings();
    fetchUserData();
    fetchPosts();
    fetchPets();
    fetchMyBusinesses();
  }, [navigate]);

  const fetchPets = async () => {
    const { data } = await supabase.from('lost_pets').select('*');
    if (data) {
      setAllPets(data);
      const isAdmin = localStorage.getItem('admin_auth') === 'true';
      if (isAdmin) {
        setMyPets(data);
      } else {
        const userWhatsapp = localStorage.getItem('user_whatsapp');
        if (userWhatsapp && userWhatsapp.trim() !== '') {
          setMyPets(data.filter(p => p.owner_whatsapp === userWhatsapp));
        } else {
          setMyPets([]);
        }
      }
    }
  };

  const fetchMyBusinesses = async () => {
    const { data } = await supabase.from('commercial_guide').select('*');
    if (data) {
      const isAdmin = localStorage.getItem('admin_auth') === 'true';
      if (isAdmin) {
        setMyBusinesses(data);
      } else {
        const userWhatsapp = localStorage.getItem('user_whatsapp');
        if (userWhatsapp && userWhatsapp.trim() !== '') {
          setMyBusinesses(data.filter(b => b.whatsapp === userWhatsapp));
        } else {
          setMyBusinesses([]);
        }
      }
    }
  };

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
    const impersonatedUserStr = localStorage.getItem('impersonatedUser');
    if (impersonatedUserStr) {
      const profile = JSON.parse(impersonatedUserStr);
      setUserName(profile.name);
      setUserAvatar(profile.avatar || `https://i.pravatar.cc/150?u=${profile.handle}`);
      setEditName(profile.name);
      if (profile.neighborhood) {
        setSelectedNeighborhood(profile.neighborhood);
        if (!allNeighborhoods.includes(profile.neighborhood)) {
          setAllNeighborhoods(prev => [...prev, profile.neighborhood]);
        }
      }
      return;
    }

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

  const handleCopyInvite = () => {
    navigator.clipboard.writeText('https://faladobairro.online/register');
    alert('Link de convite copiado! Envie para seus vizinhos no WhatsApp.');
  };

  const handleLogout = async () => {
    if (localStorage.getItem('impersonatedUser')) {
      localStorage.removeItem('impersonatedUser');
      navigate('/admin');
      return;
    }
    await supabase.auth.signOut();
    localStorage.removeItem('user_auth');
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_whatsapp');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('user_neighborhood');
    navigate('/');
  };

  const handleSaveProfile = async () => {
    let currentUserId = '';
    const impersonatedUserStr = localStorage.getItem('impersonatedUser');
    if (impersonatedUserStr) {
      currentUserId = JSON.parse(impersonatedUserStr).id;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      currentUserId = user.id;
    }

    await supabase.from('profiles').update({
      name: editName,
      avatar: editAvatar,
      handle: `@${editName.toLowerCase().replace(/\s+/g, '')}`
    }).eq('id', currentUserId);
    
    setUserName(editName);
    setUserAvatar(editAvatar);
    localStorage.setItem('user_name', editName);
    localStorage.setItem('user_avatar', editAvatar);
      
    setShowProfile(false);
    alert('Perfil atualizado com sucesso!');
    fetchPosts();
  };

  const handleSaveBusiness = async () => {
    if (!businessName || !businessCategory || !businessWhatsapp) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const item = {
      name: businessName,
      category: businessCategory,
      description: businessDescription,
      whatsapp: businessWhatsapp,
      neighborhood: selectedNeighborhood,
      rating: 5,
      is_verified: false,
      image: businessImage
    };

    const { error } = await supabase.from('commercial_guide').insert([item]);
    if (!error) {
      if (!localStorage.getItem('user_whatsapp')) {
        localStorage.setItem('user_whatsapp', businessWhatsapp);
      }
      alert('Negócio cadastrado no Guia Comercial com sucesso!');
      setShowBusinessModal(false);
      setBusinessName('');
      setBusinessCategory('');
      setBusinessDescription('');
      setBusinessWhatsapp('');
      setBusinessImage(null);
      fetchMyBusinesses();
    } else {
      alert('Erro ao cadastrar negócio: ' + error.message);
    }
  };

  const handleBusinessImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePetImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPetImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePet = async () => {
    if (!petName || !petSpecies || !petLocation || !petWhatsapp) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    
    const { error } = await supabase.from('lost_pets').insert([
      {
        pet_name: petName,
        species: petSpecies,
        description: petDescription,
        last_seen_location: petLocation,
        owner_whatsapp: petWhatsapp,
        status: petStatus,
        image: petImage
      }
    ]);
    
    if (!error) {
      if (!localStorage.getItem('user_whatsapp')) {
        localStorage.setItem('user_whatsapp', petWhatsapp);
      }
      alert(`Pet cadastrado com sucesso!`);
      setShowPetsModal(false);
      fetchPets();
    } else {
      alert('Erro ao cadastrar pet: ' + error.message);
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
      let currentUserId = '';
      const impersonatedUserStr = localStorage.getItem('impersonatedUser');
      if (impersonatedUserStr) {
        currentUserId = JSON.parse(impersonatedUserStr).id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        currentUserId = user.id;
      }
      
      const { error } = await supabase.from('posts').insert([
        {
          author_id: currentUserId,
          author_name: userName,
          author_avatar: userAvatar,
          handle: `@${userName.toLowerCase().replace(/\s+/g, '')}`,
          category: postCategory,
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

  const currentUserId = localStorage.getItem('user_id');
  let filteredPosts = posts.filter((p: any) => p.is_approved || p.author_id === currentUserId);

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
    <div className="min-h-screen bg-slate-50 pb-20 pt-10">
      {/* Pets Marquee Banner */}
      {allPets.length > 0 && (
        <div className="fixed top-0 left-0 right-0 bg-emerald-600 text-white text-xs md:text-sm font-bold shadow-md z-[120] flex items-center justify-center h-10">
          <div className="w-[300px] md:w-[400px] overflow-hidden flex items-center relative h-full">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-emerald-600 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-emerald-600 to-transparent z-10"></div>
            
            <div className="flex animate-marquee whitespace-nowrap w-max hover:[animation-play-state:paused]">
              {[...allPets, ...allPets, ...allPets, ...allPets].map((pet, idx) => (
                <div 
                  key={`${pet.id}-${idx}`} 
                  onClick={() => alert('Para mais detalhes do pet, acesse a página inicial ou cadastre o seu no menu Pets!')}
                  className="flex items-center gap-2 mx-4 cursor-pointer hover:bg-emerald-700/50 px-3 py-1 rounded-full transition-colors"
                >
                  {pet.image && <img src={pet.image} alt={pet.pet_name} className="w-5 h-5 rounded-full object-cover border border-white/20" />}
                  <span className="text-white font-bold">{pet.pet_name}</span>
                  {pet.status === 'Encontrado' || pet.status === 'Achado' ? (
                    <span className="text-emerald-900 bg-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Achado</span>
                  ) : pet.status === 'Perdido' ? (
                    <span className="text-white bg-rose-500 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Perdido</span>
                  ) : (
                    <span className="text-white bg-blue-500 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">{pet.status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!!localStorage.getItem('impersonatedUser') && (
        <div className="bg-red-600 text-white text-xs font-bold text-center py-2 px-4 shadow-md sticky top-10 z-50 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> 
          Você está navegando como se fosse {userName}. (Acesso Admin)
          <button onClick={handleLogout} className="ml-2 bg-black/20 hover:bg-black/40 px-3 py-1 rounded-full transition-colors">Sair / Voltar</button>
        </div>
      )}
      <div className={`bg-white sticky ${!!localStorage.getItem('impersonatedUser') ? 'top-[72px]' : 'top-10'} z-40 shadow-sm px-4 pt-4 pb-3`}>
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
            <button onClick={handleCopyInvite} className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors border border-emerald-200">
              <Share2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Convidar</span>
            </button>
            <button onClick={() => setShowPetsModal(true)} className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full transition-colors">
              <Dog className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Pets</span>
            </button>
            <button onClick={() => setShowBusinessModal(true)} className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-colors">
              <Store className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Minha Empresa</span>
            </button>
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
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
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

            <button onClick={handleSaveProfile} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md mb-4">
              Salvar Perfil
            </button>
            
            <div className="pt-4 border-t border-slate-100 mt-4">
              <button 
                onClick={async () => {
                  if (confirm('Tem certeza que deseja solicitar a exclusão da sua conta? O administrador revisará o pedido e, ao aprovar, todos os seus dados e publicações serão apagados permanentemente.')) {
                    try {
                      // Usar dados reais do perfil se possível, ou o estado atual
                      const { data: { user } } = await supabase.auth.getUser();
                      const whatsapp = user ? user.email || 'desconhecido' : 'desconhecido';
                      
                      const { error } = await supabase.from('deletion_requests').insert([
                        { user_name: userName, user_whatsapp: whatsapp, status: 'Pendente' }
                      ]);
                      if (error) throw error;
                      alert('Solicitação de exclusão enviada ao administrador.');
                      setShowProfile(false);
                    } catch (e: any) {
                      alert('Erro ao solicitar exclusão: ' + e.message);
                    }
                  }
                }}
                className="w-full text-red-500 font-bold py-2 rounded-xl hover:bg-red-50 transition-colors text-sm border border-red-100"
              >
                Solicitar Exclusão da Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {showPetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowPetsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 mb-4 justify-center text-rose-500">
              <Dog className="w-6 h-6" />
              <h3 className="text-xl font-bold text-slate-800 text-center">Pets</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 text-center">
              Cadastre um pet perdido para a comunidade ajudar a encontrar, ou disponibilize um para adoção.
            </p>

            <div className="flex gap-4 mb-4">
              <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${petStatus === 'Perdido' ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <input type="radio" name="petStatus" value="Perdido" checked={petStatus === 'Perdido'} onChange={() => setPetStatus('Perdido')} className="hidden" />
                Perdido
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${petStatus === 'Adoção' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <input type="radio" name="petStatus" value="Adoção" checked={petStatus === 'Adoção'} onChange={() => setPetStatus('Adoção')} className="hidden" />
                Adoção
              </label>
            </div>
            <div className="flex flex-col items-center mb-4">
              <div className="w-full h-32 bg-slate-100 rounded-xl overflow-hidden mb-2 relative group flex items-center justify-center border-2 border-dashed border-slate-300">
                {petImage ? (
                  <img src={petImage} alt="Pet" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">Adicionar Foto</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePetImageUpload} />
                </label>
              </div>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Pet</label>
                <input 
                  type="text" value={petName} onChange={(e) => setPetName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 font-medium text-sm"
                  placeholder="Ex: Rex"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Espécie/Raça</label>
                <input 
                  type="text" value={petSpecies} onChange={(e) => setPetSpecies(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 font-medium text-sm"
                  placeholder="Ex: Cão/Vira-lata"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Localização</label>
              <input 
                type="text" value={petLocation} onChange={(e) => setPetLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 font-medium text-sm"
                placeholder="Ex: Rua das Flores, Centro"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp (apenas números)</label>
              <input 
                type="text" value={petWhatsapp} onChange={(e) => setPetWhatsapp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 font-medium text-sm"
                placeholder="5511999999999"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição Adicional</label>
              <textarea 
                value={petDescription} onChange={(e) => setPetDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 font-medium text-sm min-h-[60px]"
                placeholder="Detalhes adicionais..."
              />
            </div>
            <button onClick={handleSavePet} className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition-colors shadow-md">
              Cadastrar Pet
            </button>
          </div>
        </div>
      )}

      {showBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowBusinessModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 mb-4 justify-center text-amber-500">
              <Store className="w-6 h-6" />
              <h3 className="text-xl font-bold text-slate-800 text-center">Minha Empresa</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 text-center">
              Divulgue seu negócio grátis no Guia Comercial do bairro! Outros moradores poderão te achar mais facilmente.
            </p>

            <div className="flex flex-col items-center mb-4">
              <div className="w-full h-32 bg-slate-100 rounded-xl overflow-hidden mb-2 relative group flex items-center justify-center border-2 border-dashed border-slate-300">
                {businessImage ? (
                  <img src={businessImage} alt="Business" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">Logotipo da Empresa</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleBusinessImageUpload} />
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Negócio</label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500 font-medium"
                placeholder="Ex: João Eletricista"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Categoria</label>
              <input 
                type="text" 
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500 font-medium"
                placeholder="Ex: Serviços, Alimentação, Beleza"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
              <textarea 
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500 font-medium min-h-[80px]"
                placeholder="Descreva o que você faz..."
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp (apenas números)</label>
              <input 
                type="text" 
                value={businessWhatsapp}
                onChange={(e) => setBusinessWhatsapp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500 font-medium"
                placeholder="5511999999999"
              />
            </div>
            <button onClick={handleSaveBusiness} className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-colors shadow-md flex items-center justify-center gap-2">
              <Megaphone className="w-5 h-5" />
              Publicar no Guia Comercial
            </button>
          </div>
        </div>
      )}

      <div className="bg-amber-50/80 border-b border-amber-200 p-3 text-center mb-2">
        <p className="text-amber-800 text-sm font-medium">
          <Store className="inline-block w-4 h-4 mr-1 mb-1" />
          Tem um negócio no bairro? Divulgue de graça! Acesse <strong>Minha Empresa</strong> no menu acima.
        </p>
      </div>

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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-colors ${postCategory === 'Postagem' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" name="category" value="Postagem" checked={postCategory === 'Postagem'} onChange={() => setPostCategory('Postagem')} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${postCategory === 'Postagem' ? 'border-blue-500' : 'border-slate-300'}`}>
                    {postCategory === 'Postagem' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                  <span className="text-sm font-bold">Postagem</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-colors ${postCategory === 'Denúncia' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" name="category" value="Denúncia" checked={postCategory === 'Denúncia'} onChange={() => setPostCategory('Denúncia')} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${postCategory === 'Denúncia' ? 'border-red-500' : 'border-slate-300'}`}>
                    {postCategory === 'Denúncia' && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                  </div>
                  <span className="text-sm font-bold">Denúncia</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer text-slate-500">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Foto/Vídeo</span>
                  <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => e.target.files && setSelectedMedia(e.target.files[0])} />
                </label>
                <button 
                  onClick={handlePublish}
                  disabled={!postContent.trim() && !selectedMedia}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  PUBLICAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meus Pets Section */}
      {myPets.length > 0 && (
        <div className="max-w-md mx-auto md:max-w-2xl px-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Dog className="w-5 h-5 text-rose-500" /> Meus Pets Cadastrados
            </h3>
            <div className="space-y-3">
              {myPets.map(pet => (
                <div key={pet.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {pet.image ? (
                    <img src={pet.image} alt={pet.pet_name} className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
                      <Dog className="w-6 h-6 text-rose-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{pet.pet_name}</p>
                    <p className="text-xs text-slate-500">{pet.species} • {pet.status}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={async () => {
                        const newName = window.prompt('Nome do pet:', pet.pet_name);
                        if (newName && newName !== pet.pet_name) {
                          const newDesc = window.prompt('Descrição:', pet.description || '');
                          const newLocation = window.prompt('Localização:', pet.last_seen_location || '');
                          await supabase.from('lost_pets').update({ 
                            pet_name: newName, 
                            description: newDesc || pet.description,
                            last_seen_location: newLocation || pet.last_seen_location 
                          }).eq('id', pet.id);
                          fetchPets();
                        }
                      }}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Excluir ${pet.pet_name}?`)) {
                          await supabase.from('lost_pets').delete().eq('id', pet.id);
                          fetchPets();
                        }
                      }}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Minhas Empresas Section */}
      {myBusinesses.length > 0 && (
        <div className="max-w-md mx-auto md:max-w-2xl px-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" /> Minhas Empresas
            </h3>
            <div className="space-y-3">
              {myBusinesses.map(biz => (
                <div key={biz.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {biz.image ? (
                    <img src={biz.image} alt={biz.name} className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                      <Store className="w-6 h-6 text-amber-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{biz.name}</p>
                    <p className="text-xs text-slate-500">{biz.category}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={async () => {
                        const newName = window.prompt('Nome do negócio:', biz.name);
                        if (newName && newName !== biz.name) {
                          const newDesc = window.prompt('Descrição:', biz.description || '');
                          const newCat = window.prompt('Categoria:', biz.category || '');
                          await supabase.from('commercial_guide').update({ 
                            name: newName, 
                            description: newDesc || biz.description,
                            category: newCat || biz.category 
                          }).eq('id', biz.id);
                          fetchMyBusinesses();
                        }
                      }}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Excluir ${biz.name}?`)) {
                          await supabase.from('commercial_guide').delete().eq('id', biz.id);
                          fetchMyBusinesses();
                        }
                      }}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto md:max-w-2xl">
        {filteredPosts.map((post: any) => (
          <PostCard key={post.id} post={post} onDelete={(id: number) => setPosts(posts.filter(p => p.id !== id))} onImageClick={(img: string) => setSelectedImage(img)} />
        ))}
        {filteredPosts.length === 0 && (
          <div className="text-center text-slate-500 py-10">
            Nenhuma publicação encontrada para este filtro.
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[120] bg-black/90 flex flex-col items-center justify-center">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2"
          >
            <X className="w-8 h-8" />
          </button>
          <img src={selectedImage} className="max-w-full max-h-screen object-contain" alt="Imagem ampliada" />
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onDelete, onImageClick }: { post: any, onDelete: (id: number) => void, onImageClick: (img: string) => void }) {
  const [liked, setLiked] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);

  const [likes, setLikes] = useState(post.likes || 0);
  const [upvotes, setUpvotes] = useState(post.upvotes || 0);
  const [downvotes, setDownvotes] = useState(post.downvotes || 0);

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [currentContent, setCurrentContent] = useState(post.content);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(0);

  const userId = localStorage.getItem('user_id');
  const userName = localStorage.getItem('user_name') || 'Anônimo';
  const isAdmin = localStorage.getItem('admin_auth') === 'true';
  const isMine = post.author_id === userId && userId !== null && userId !== '';

  useEffect(() => {
    fetchCommentCount();
  }, []);

  const fetchCommentCount = async () => {
    const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
    if (count !== null) setCommentCount(count);
  };

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
      setCommentCount(prev => prev + 1);
    }
  };

  const handleDeleteComment = async (cid: number) => {
    await supabase.from('comments').delete().eq('id', cid);
    setComments(comments.filter(c => c.id !== cid));
    setCommentCount(prev => Math.max(0, prev - 1));
  };

  const handleDeletePost = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta postagem?')) {
      await supabase.from('posts').delete().eq('id', post.id);
      onDelete(post.id);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    const { error } = await supabase.from('posts').update({ content: editContent }).eq('id', post.id);
    if (!error) {
      setCurrentContent(editContent);
      setIsEditing(false);
    } else {
      alert('Erro ao editar: ' + error.message);
    }
  };

  return (
    <div className="bg-white mb-4 sm:mb-6 shadow-sm sm:rounded-2xl sm:border sm:border-slate-100 transition-all hover:shadow-md overflow-hidden">
      <div className="flex justify-between items-start p-4 relative">
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
        
        {(isMine || isAdmin) && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-10 py-1">
                {isMine && (
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                )}
                <button onClick={handleDeletePost} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.image && (
        <div className="w-full bg-slate-900 overflow-hidden max-h-[500px] relative">
          {post.image.startsWith('data:video/') || post.image.match(/\.(mp4|webm|mov)$/i) ? (
            <video 
              src={post.image} 
              controls 
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <img 
              src={post.image} 
              alt="Post content"
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => onImageClick(post.image)}
            />
          )}
        </div>
      )}

      {isEditing ? (
        <div className="px-4 py-3">
          <textarea 
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px]"
            placeholder="Digite a descrição da postagem..."
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => { setIsEditing(false); setEditContent(currentContent); }} className="px-4 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={handleSaveEdit} className="px-4 py-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
              Salvar
            </button>
          </div>
        </div>
      ) : (
        currentContent && (
          <p className="text-slate-800 px-4 py-3 text-[15px] leading-relaxed">
            {currentContent}
          </p>
        )
      )}

      <div className="flex justify-between items-center text-slate-500 p-4 border-t border-slate-50 flex-wrap gap-y-3">
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
        
        <div className="flex items-center gap-4 ml-auto">
          {(isMine || isAdmin) && (
            <div className="flex items-center gap-3 mr-2 border-r border-slate-200 pr-3">
              <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <Edit2 className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Editar</span>
              </button>
              <button onClick={handleDeletePost} className="flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Excluir</span>
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 transition-colors ${showComments ? 'text-blue-600' : 'hover:text-blue-500'}`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {commentCount > 0 ? `${commentCount} Comentário${commentCount > 1 ? 's' : ''}` : 'Comentar'}
            </span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
          <div className="space-y-3 mt-4 mb-4">
            {comments.map((c: any) => {
              const isMine = c.author_name === userName && userName !== 'Anônimo' && userName !== '';
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
