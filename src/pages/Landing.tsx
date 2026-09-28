import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight, Users, Zap, ShieldCheck, MapPin, Heart, Image as ImageIcon, Menu, X, ThumbsUp, ThumbsDown, ArrowLeft, Home, Newspaper, Store, Megaphone, Share2, PhoneCall, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Landing() {
  const [config, setConfig] = useState({
    bgImage: '/imagens-da-noticias/design-sem-nome-5-.avif',
    newsImg: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80',
    newsMain: 'Reunião de Segurança Comunitária define novas regras',
    newsSide1: 'Falta de Água na Rua 15 será resolvida amanhã',
    newsSide2: 'Nova feira de rua aos domingos confirmada',
    newsList: [] as any[]
  });

  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sessionVotes, setSessionVotes] = useState<Record<string, boolean>>({});
  const [commercialGuide, setCommercialGuide] = useState<any[]>([]);
  const [lostPets, setLostPets] = useState<any[]>([]);
  const [adoptionPets, setAdoptionPets] = useState<any[]>([]);
  const [allPets, setAllPets] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchPublicPosts();
    fetchCommercialGuide();
    fetchLostPets();
  }, []);

  const fetchLostPets = async () => {
    const { data } = await supabase.from('lost_pets').select('*');
    if (data) {
      setAllPets(data);
      setLostPets(data.filter(p => p.status === 'Perdido'));
      setAdoptionPets(data.filter(p => p.status === 'Adoção'));
    }
  };

  const fetchCommercialGuide = async () => {
    const { data } = await supabase.from('commercial_guide').select('*');
    if (data) setCommercialGuide(data);
  };

  const fetchPublicPosts = async () => {
    // Busca os posts sem filtro SQL para evitar problemas de cache/tipagem de booleanos
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) {
      // Filtra no JavaScript
      const approved = data.filter(p => p.is_approved === true || String(p.is_approved) === 'true').slice(0, 6);
      setPublicPosts(approved);
    }
  };

  const handleVote = async (postId: number, field: 'likes' | 'upvotes' | 'downvotes') => {
    const voteKey = `${postId}-${field}`;
    if (sessionVotes[voteKey]) return; // Prevent multiple votes in same session
    
    setSessionVotes(prev => ({ ...prev, [voteKey]: true }));
    
    // Otimista
    setPublicPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, [field]: (p[field] || 0) + 1 };
      }
      return p;
    }));

    const post = publicPosts.find(p => p.id === postId);
    if (post) {
      await supabase.from('posts').update({ [field]: (post[field] || 0) + 1 }).eq('id', postId);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const getVal = (k: string) => data.find(s => s.key === k)?.value;
      
      let parsedNews = [];
      try {
        const rawNews = getVal('landing_news_list');
        if (rawNews) parsedNews = JSON.parse(rawNews);
      } catch (e) {}

      setConfig(prev => ({
        bgImage: getVal('landing_bg_image') || prev.bgImage,
        newsList: Array.isArray(parsedNews) && parsedNews.length > 0 ? parsedNews : [
          { id: '1', title: getVal('landing_news_main_title') || prev.newsMain, image: getVal('landing_news_main_img') || prev.newsImg, label: 'Destaque' },
          { id: '2', title: getVal('landing_news_side1_title') || prev.newsSide1, image: '', label: 'Aviso Urgente' },
          { id: '3', title: getVal('landing_news_side2_title') || prev.newsSide2, image: '', label: 'Comunidade' }
        ],
        newsImg: getVal('landing_news_main_img') || prev.newsImg,
        newsMain: getVal('landing_news_main_title') || prev.newsMain,
        newsSide1: getVal('landing_news_side1_title') || prev.newsSide1,
        newsSide2: getVal('landing_news_side2_title') || prev.newsSide2,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-200 pb-20 md:pb-0 pt-10">
      {/* Pets Marquee Banner */}
      {allPets.length > 0 ? (
        <div className="fixed top-0 left-0 right-0 bg-emerald-600 text-white text-xs md:text-sm font-bold shadow-md z-[120] flex items-center justify-center h-10">
          <div className="w-[300px] md:w-[400px] overflow-hidden flex items-center relative h-full">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-emerald-600 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-emerald-600 to-transparent z-10"></div>
            
            <div className="flex animate-marquee whitespace-nowrap min-w-full hover:[animation-play-state:paused]">
              {[...allPets, ...allPets, ...allPets, ...allPets].map((pet, idx) => (
                <div 
                  key={`${pet.id}-${idx}`} 
                  onClick={() => setSelectedPet(pet)}
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
      ) : (
        <div className="fixed top-0 left-0 right-0 bg-emerald-600 text-white text-xs md:text-sm font-bold py-2.5 px-6 text-center shadow-md z-[120] h-10">
          Carregando informações...
        </div>
      )}

      {/* Hero Section */}
      <div className="relative text-white overflow-hidden pb-32">
        {/* Top Navigation Menu */}
        <nav className="fixed top-10 left-0 right-0 z-[100] border-b border-white/10 bg-slate-900/90 backdrop-blur-md shadow-lg transition-all duration-300">
          <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
              <span className="font-black tracking-tight text-xl">Fala do Bairro</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8 font-bold text-sm">
              <a href="#" className="text-white hover:text-emerald-400 transition-colors">Início</a>
              <a href="#noticias" className="text-slate-300 hover:text-emerald-400 transition-colors">Notícias</a>
              <a href="#mural" className="text-slate-300 hover:text-emerald-400 transition-colors">Mural Público</a>
              <Link to="/login" className="text-slate-300 hover:text-emerald-400 transition-colors">Entrar</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2.5 rounded-xl transition-transform active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                Criar Conta
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden bg-slate-900 border-b border-white/10 px-6 py-6 flex flex-col gap-4 font-bold animate-fade-in-down absolute w-full">
              <a href="#" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-emerald-400">Início</a>
              <a href="#noticias" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-emerald-400">Notícias</a>
              <a href="#mural" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-emerald-400">Mural Público</a>
              <div className="h-px bg-white/10 my-2"></div>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-emerald-400">Entrar na Conta</Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="bg-emerald-500 text-emerald-950 px-5 py-3 rounded-xl text-center mt-2">Criar Conta Grátis</Link>
            </div>
          )}
        </nav>

        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${config.bgImage}')` }}
        ></div>
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]"></div>

        <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
          {/* Main Copy */}
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.15] tracking-tight text-white drop-shadow-md">
              O que acontece no seu bairro, <br className="hidden sm:block" />
              <span className="text-emerald-400">a comunidade conta.</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Emergency Phones Quick Dial */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-32 relative z-20 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="tel:190" className="bg-red-500/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:bg-red-600 transition-colors border border-red-400">
            <div>
              <p className="text-xs font-bold uppercase opacity-90">Polícia Militar</p>
              <p className="text-2xl font-black">190</p>
            </div>
            <PhoneCall className="w-8 h-8 opacity-80" />
          </a>
          <a href="tel:192" className="bg-orange-500/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:bg-orange-600 transition-colors border border-orange-400">
            <div>
              <p className="text-xs font-bold uppercase opacity-90">SAMU</p>
              <p className="text-2xl font-black">192</p>
            </div>
            <PhoneCall className="w-8 h-8 opacity-80" />
          </a>
          <a href="tel:193" className="bg-red-700/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:bg-red-800 transition-colors border border-red-600">
            <div>
              <p className="text-xs font-bold uppercase opacity-90">Bombeiros</p>
              <p className="text-2xl font-black">193</p>
            </div>
            <PhoneCall className="w-8 h-8 opacity-80" />
          </a>
          <a href="tel:153" className="bg-blue-600/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:bg-blue-700 transition-colors border border-blue-500">
            <div>
              <p className="text-xs font-bold uppercase opacity-90">Guarda Municipal</p>
              <p className="text-2xl font-black">153</p>
            </div>
            <PhoneCall className="w-8 h-8 opacity-80" />
          </a>
        </div>
      </div>

      {/* Lost Pets Alert Section */}
      {lostPets.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-20 mb-12">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-[2rem] p-6 md:p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex flex-col gap-8 relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                  <span className="font-black uppercase tracking-widest text-sm">Alerta Pet Perdido</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 leading-tight">
                  Você viu este animal?
                </h3>
                <p className="text-slate-600 font-medium mb-6 max-w-2xl mx-auto">
                  Nossos vizinhos estão precisando de ajuda para encontrar seus pets. Compartilhe nos grupos!
                </p>
                <Link to="/login" className="bg-white text-red-600 hover:bg-red-50 border-2 border-red-200 font-bold px-8 py-3 rounded-xl shadow-sm transition-colors uppercase text-sm tracking-wide">
                  Cadastrar Animal Perdido
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {lostPets.map(pet => (
                  <div 
                    key={pet.id} 
                    className="bg-white rounded-2xl p-4 shadow-md border border-red-100 flex gap-4 items-center cursor-pointer hover:border-red-300 transition-colors"
                    onClick={() => setSelectedPet(pet)}
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-red-100">
                      {pet.image ? (
                        <img src={pet.image} alt={pet.pet_name} className="w-full h-full object-contain bg-slate-100" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-lg text-slate-800 leading-none mb-1">{pet.pet_name}</h4>
                      <p className="text-xs font-bold text-red-500 mb-2">{pet.species}</p>
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2">{pet.description}</p>
                      <button 
                        onClick={() => {
                          const text = encodeURIComponent(`Olá! Vi no Fala do Bairro sobre o ${pet.pet_name}. Queria dar uma informação.`);
                          window.open(`https://wa.me/${pet.owner_whatsapp}?text=${text}`, '_blank');
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 w-max"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Avisar Tutor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adoption Pets Section */}
      {adoptionPets.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-20 mb-12">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Pets para adoção</h3>
              <p className="text-slate-500 font-medium text-sm">Pets anunciados em sua região.</p>
            </div>
            <button className="text-sm font-bold text-slate-500 hover:text-emerald-600 underline">
              Ver na minha região
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {adoptionPets.map(pet => (
              <div key={pet.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
                <div className="bg-emerald-500 text-white text-center py-2 font-bold text-sm">
                  Para Adoção
                </div>
                <div className="h-48 overflow-hidden relative">
                  {pet.image ? (
                    <img src={pet.image} alt={pet.pet_name} className="w-full h-full object-contain bg-slate-100" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-lg leading-tight">{pet.pet_name}</h4>
                    <button className="text-amber-400 hover:text-amber-500">
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{pet.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <p className="text-[10px] text-slate-400 max-w-[60%] truncate">{pet.last_seen_location}</p>
                    <button 
                      onClick={() => {
                        const text = encodeURIComponent(`Olá! Tenho interesse em adotar o ${pet.pet_name} que vi no Fala do Bairro.`);
                        window.open(`https://wa.me/${pet.owner_whatsapp}?text=${text}`, '_blank');
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-colors"
                    >
                      Adotar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic News Highlights */}
      {config.newsList && config.newsList.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-20 mb-20">
          <div id="noticias" className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-6 md:p-10 lg:p-12 border border-slate-100 ring-1 ring-slate-900/5 scroll-mt-24">
            <div className="flex flex-col items-center text-center mb-10">
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 border border-emerald-200">
                Fique Informado
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight flex items-center justify-center gap-3">
                <Zap className="w-8 h-8 text-emerald-500" /> Últimas Notícias
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.newsList.map((news: any, index: number) => {
                return (
                  <div 
                    key={news.id || index} 
                    onClick={() => setSelectedNews(news)}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-emerald-300 hover:shadow-xl transition-all group flex flex-col cursor-pointer col-span-1"
                  >
                    
                    <div className="overflow-hidden relative flex-shrink-0 h-48 md:h-56">
                      {news.image ? (
                        <img src={news.image} alt={news.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                           <Zap className="w-16 h-16 text-white/10" />
                        </div>
                      )}
                      <div className="absolute top-5 left-5 bg-blue-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-md">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">{news.label || 'Notícia'}</span>
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 flex flex-col flex-1 bg-white">
                      <h4 className="font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors mb-3 text-lg md:text-xl">
                        {news.title}
                      </h4>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 group-hover:text-emerald-500 font-bold text-sm">
                        <span>Ler matéria completa</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Guia Comercial Section */}
      {commercialGuide.length > 0 && (
        <div id="guia" className="bg-slate-50 py-20 border-t border-slate-200 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-12">
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 border border-emerald-200">
                Quem Indica?
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight flex items-center justify-center gap-3">
                <Store className="w-8 h-8 text-emerald-500" /> Guia Comercial
              </h3>
              <p className="text-slate-500 font-medium max-w-xl mx-auto text-lg leading-relaxed">
                Profissionais autônomos e comércios recomendados por seus vizinhos. Valorize o que é nosso!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {commercialGuide.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedBusiness(item)}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all flex flex-col h-full cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4 items-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                      ) : (
                        <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 text-emerald-500">
                          <Store className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-black text-slate-800 leading-tight">{item.name}</h4>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">{item.category}</span>
                      </div>
                    </div>
                    {item.is_verified && (
                      <div className="bg-blue-50 text-blue-600 p-1.5 rounded-full" title="Verificado pela Comunidade">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3">{item.description}</p>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center gap-1 text-amber-400">
                      <span className="text-sm font-bold text-slate-700 ml-1">★ {item.rating}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const text = encodeURIComponent(`Olá, ${item.name}! Vi seu anúncio no Fala do Bairro e gostaria de um orçamento.`);
                        window.open(`https://wa.me/${item.whatsapp}?text=${text}`, '_blank');
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
               <Link to={localStorage.getItem('user_auth') === 'true' ? '/feed' : '/register'} className="inline-block border-2 border-emerald-500 text-emerald-600 font-bold px-8 py-4 rounded-xl hover:bg-emerald-50 transition-colors">
                  Divulgar Grátis Meu Negócio
               </Link>
            </div>
          </div>
        </div>
      )}

      {/* Public Mural Section */}
      {publicPosts.length > 0 && (
        <div id="mural" className="bg-slate-900 py-24 border-t border-slate-800 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-16">
              <span className="bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 border border-blue-500/30">
                Portfólio da Comunidade
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                Mural Público do Bairro
              </h3>
              <p className="text-slate-400 font-medium max-w-xl mx-auto text-lg leading-relaxed">
                Aqui você pode se cadastrar, fazer suas próprias postagens, enviar denúncias e interagir com toda a comunidade em tempo real.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publicPosts.map((post) => (
                <div key={post.id} className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-colors group flex flex-col h-full shadow-xl">
                  {post.image ? (
                    <div 
                      className="h-48 overflow-hidden relative cursor-pointer bg-slate-900"
                      onClick={() => setSelectedNews({ title: `Postagem de ${post.author_name}`, description: post.content, image: post.image, label: post.category })}
                    >
                      <img src={post.image} alt="Post" className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-bold text-white">{post.neighborhood}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative overflow-hidden">
                      <ImageIcon className="w-12 h-12 text-slate-600/50" />
                      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-bold text-white">{post.neighborhood}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={post.author_avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-600" />
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">{post.author_name}</p>
                        <p className="text-slate-400 text-xs">{post.handle}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 mb-6">
                      <p className="text-slate-300 text-sm leading-relaxed mb-2">
                        {post.content.length > 120 ? post.content.substring(0, 120) + '...' : post.content}
                      </p>
                      {post.content.length > 120 && (
                        <button 
                          onClick={() => setSelectedNews({ title: `Postagem de ${post.author_name}`, description: post.content, image: post.image, label: post.category })}
                          className="text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors underline decoration-blue-500/30 underline-offset-4"
                        >
                          Ler mais
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mt-auto">
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg tracking-wide">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleVote(post.id, 'likes')}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${sessionVotes[`${post.id}-likes`] ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-red-400'}`}
                        >
                          <Heart className="w-4 h-4" />
                          <span className="text-xs font-bold">{post.likes || 0}</span>
                        </button>

                        <button 
                          onClick={() => handleVote(post.id, 'upvotes')}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${sessionVotes[`${post.id}-upvotes`] ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-emerald-400'}`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-xs font-bold">{post.upvotes || 0}</span>
                        </button>

                        <button 
                          onClick={() => handleVote(post.id, 'downvotes')}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${sessionVotes[`${post.id}-downvotes`] ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-amber-400'}`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span className="text-xs font-bold">{post.downvotes || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="bg-slate-50 py-24 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Por que usar o Fala do Bairro?</h3>
            <p className="text-slate-500 font-medium max-w-lg mx-auto">Tudo que você precisa para estar conectado com a sua comunidade local em um só lugar.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="w-6 h-6 text-amber-500" />, title: 'Informação Rápida', desc: 'Saiba de tudo que acontece no bairro em tempo real.', color: 'bg-amber-50' },
              { icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />, title: 'Segurança Local', desc: 'Avisos da administração e alertas de vizinhos.', color: 'bg-emerald-50' },
              { icon: <Users className="w-6 h-6 text-blue-500" />, title: 'Comunidade Unida', desc: 'Apoie o comércio local e conheça seus vizinhos.', color: 'bg-blue-50' },
            ].map((item, i) => (
               <div key={i} className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                 <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                   {item.icon}
                 </div>
                 <h4 className="font-bold text-slate-800 text-xl mb-3 tracking-tight">{item.title}</h4>
                 <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* News Reading Full Screen View */}
      {selectedNews && (
        <div 
          className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-fade-in" 
        >
          <div className="w-full relative">
            <button 
              onClick={() => setSelectedNews(null)}
              className="fixed top-6 left-6 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.15)] text-blue-700 hover:text-blue-900 rounded-xl px-5 py-3 z-[110] transition-colors flex items-center gap-2 font-black text-sm uppercase tracking-wide border-2 border-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>

            <button 
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                const text = encodeURIComponent(`Veja essa notícia no Fala do Bairro: ${selectedNews.title}`);
                window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
              }}
              className="fixed bottom-6 right-6 md:top-6 md:bottom-auto bg-green-500 hover:bg-green-600 shadow-[0_8px_30px_rgba(34,197,94,0.3)] text-white rounded-full px-5 py-3 z-[110] transition-transform flex items-center gap-2 font-black text-sm uppercase tracking-wide border-2 border-white/20 active:scale-95"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
            
            <div className="w-full h-[50vh] md:h-[65vh] relative bg-slate-900">
              {selectedNews.image ? (
                <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                   <Zap className="w-24 h-24 text-white/10" />
                </div>
              )}
              <div className="absolute top-6 left-6 md:top-8 md:left-8 bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-md">
                <span className="text-sm font-bold text-white uppercase tracking-widest">{selectedNews.label || 'Notícia'}</span>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto p-8 md:p-12 lg:p-16">
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-8 leading-tight">
                {selectedNews.title}
              </h1>
              {selectedNews.description ? (
                <div className="text-slate-700 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedNews.description}
                </div>
              ) : (
                <p className="text-slate-400 italic text-lg">Nenhum detalhe adicional fornecido para esta notícia.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPet && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col md:flex-row overflow-y-auto overflow-x-hidden">
          <div className="w-full relative">
            <button 
              onClick={() => setSelectedPet(null)}
              className="fixed top-6 left-6 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.15)] text-red-700 hover:text-red-900 rounded-xl px-5 py-3 z-[110] transition-colors flex items-center gap-2 font-black text-sm uppercase tracking-wide border-2 border-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>

            <button 
              onClick={() => {
                const text = encodeURIComponent(`Olá! Vi no Fala do Bairro sobre o ${selectedPet.pet_name}. Queria dar uma informação.`);
                window.open(`https://wa.me/${selectedPet.owner_whatsapp}?text=${text}`, '_blank');
              }}
              className="fixed bottom-6 right-6 md:top-6 md:bottom-auto bg-green-500 hover:bg-green-600 shadow-[0_8px_30px_rgba(34,197,94,0.3)] text-white rounded-full px-5 py-3 z-[110] transition-transform flex items-center gap-2 font-black text-sm uppercase tracking-wide border-2 border-white/20 active:scale-95"
            >
              <PhoneCall className="w-5 h-5" />
              <span className="hidden sm:inline">Avisar Tutor</span>
            </button>
            
            <div className="w-full h-[50vh] md:h-[65vh] relative bg-slate-900">
              {selectedPet.image ? (
                <img src={selectedPet.image} alt={selectedPet.pet_name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                   <ImageIcon className="w-24 h-24 text-white/10" />
                </div>
              )}
              <div className="absolute top-6 left-6 md:top-8 md:left-8 bg-red-600/90 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-md mt-16 md:mt-0">
                <span className="text-sm font-bold text-white uppercase tracking-widest">Pet Perdido</span>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto p-8 md:p-12 lg:p-16">
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-2 leading-tight">
                {selectedPet.pet_name}
              </h1>
              <p className="text-xl font-bold text-red-500 mb-8">{selectedPet.species}</p>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <h4 className="font-bold text-slate-700 mb-2 uppercase text-sm tracking-wide">Visto por último em</h4>
                  <p className="text-lg text-slate-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-500" />
                    {selectedPet.last_seen_location}
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                  <h4 className="font-bold text-slate-700 mb-2 uppercase text-sm tracking-wide">Contato do Tutor</h4>
                  <p className="text-lg text-slate-800 flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-green-600" />
                    {selectedPet.owner_whatsapp}
                  </p>
                </div>
              </div>

              {selectedPet.description && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 uppercase text-sm tracking-wide">Descrição e Detalhes</h4>
                  <div className="text-slate-700 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedPet.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Business Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedBusiness(null)}>
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedBusiness(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 backdrop-blur-md transition-colors z-10">
              <X className="w-5 h-5" />
            </button>
            <div className="w-full bg-slate-100 flex items-center justify-center relative p-8">
              {selectedBusiness.image ? (
                <img src={selectedBusiness.image} alt={selectedBusiness.name} className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-white" />
              ) : (
                <div className="w-32 h-32 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white text-emerald-500">
                  <Store className="w-16 h-16" />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedBusiness.name}</h3>
                  <span className="text-sm font-bold text-slate-500">{selectedBusiness.category}</span>
                </div>
                {selectedBusiness.is_verified && (
                  <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verificado
                  </div>
                )}
              </div>
              <p className="text-slate-600 mb-6">{selectedBusiness.description}</p>
              
              {(localStorage.getItem('admin_auth') === 'true' || localStorage.getItem('user_whatsapp') === selectedBusiness.whatsapp) && (
                <div className="flex gap-2 mb-6 border-b border-slate-100 pb-4">
                  <button 
                    onClick={async () => {
                       if (confirm('Tem certeza que deseja excluir esta empresa?')) {
                         await supabase.from('commercial_guide').delete().eq('id', selectedBusiness.id);
                         alert('Empresa excluída com sucesso!');
                         setSelectedBusiness(null);
                         fetchCommercialGuide();
                       }
                    }}
                    className="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-xl border border-red-100 hover:bg-red-100 text-sm"
                  >
                    Excluir Empresa
                  </button>
                </div>
              )}

              <button 
                onClick={() => {
                  const text = encodeURIComponent(`Olá, ${selectedBusiness.name}! Vi seu anúncio no Fala do Bairro e gostaria de um orçamento.`);
                  window.open(`https://wa.me/${selectedBusiness.whatsapp}?text=${text}`, '_blank');
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Chamar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-[90] pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <a href="#" className="flex flex-col items-center justify-center w-full h-full text-blue-600">
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold tracking-wide">Início</span>
        </a>
        <a href="#noticias" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-blue-600 transition-colors">
          <Newspaper className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold tracking-wide">Notícias</span>
        </a>
        <a href="#mural" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-blue-600 transition-colors">
          <Megaphone className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold tracking-wide">Mural</span>
        </a>
        <Link to="/login" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-blue-600 transition-colors">
          <Store className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold tracking-wide">Guia Local</span>
        </Link>
      </div>

    </div>
  );
}
