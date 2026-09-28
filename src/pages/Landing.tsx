import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight, Users, Zap, ShieldCheck, MapPin, Heart, Image as ImageIcon, Menu, X } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchPublicPosts();
  }, []);

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
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-200">
      {/* Hero Section */}
      <div className="relative text-white overflow-hidden pb-32">
        {/* Top Navigation Menu */}
        <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/10 bg-slate-900/90 backdrop-blur-md shadow-lg transition-all duration-300">
          <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-amber-400" />
              <span className="font-black tracking-tight text-xl">Fala do Bairro</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8 font-bold text-sm">
              <a href="#" className="text-white hover:text-amber-400 transition-colors">Início</a>
              <a href="#noticias" className="text-slate-300 hover:text-amber-400 transition-colors">Notícias</a>
              <a href="#mural" className="text-slate-300 hover:text-amber-400 transition-colors">Mural Público</a>
              <Link to="/login" className="text-slate-300 hover:text-amber-400 transition-colors">Entrar</Link>
              <Link to="/register" className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-5 py-2.5 rounded-xl transition-transform active:scale-95 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
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
              <a href="#" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-amber-400">Início</a>
              <a href="#noticias" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-amber-400">Notícias</a>
              <a href="#mural" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-amber-400">Mural Público</a>
              <div className="h-px bg-white/10 my-2"></div>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-amber-400">Entrar na Conta</Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="bg-amber-400 text-amber-950 px-5 py-3 rounded-xl text-center mt-2">Criar Conta Grátis</Link>
            </div>
          )}
        </nav>

        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${config.bgImage}')` }}
        ></div>
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]"></div>

        <div className="max-w-5xl mx-auto px-6 pt-32 pb-12 relative z-10">
          {/* Header */}
          <div className="flex justify-center items-center gap-3 mb-16 animate-fade-in-down">
            <div className="bg-amber-400 p-2.5 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.4)]">
              <MessageCircle className="w-8 h-8 text-amber-950" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              FALA DO BAIRRO
            </h1>
          </div>
          
          {/* Main Copy */}
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-12 leading-[1.15] tracking-tight">
              O que acontece no seu bairro, <br className="hidden md:block" />
              <span className="text-amber-400">a comunidade conta.</span>
            </h2>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0">
              <Link to="/register" className="group bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold py-4 px-8 rounded-2xl shadow-[0_8px_25px_rgba(251,191,36,0.3)] transition-all active:scale-95 text-lg flex justify-center items-center gap-2">
                CRIAR CONTA GRÁTIS
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-4 px-8 rounded-2xl transition-all border border-white/20 flex justify-center items-center shadow-lg active:scale-95">
                JÁ TENHO CONTA
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic News Highlights */}
      {config.newsList && config.newsList.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-20 mb-20">
          <div id="noticias" className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 md:p-10 border-2 border-amber-400 scroll-mt-24">
            <div className="flex flex-col items-center text-center mb-10">
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 border border-amber-200">
                Fique Informado
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight flex items-center justify-center gap-3">
                <Zap className="w-8 h-8 text-amber-500" /> Últimas Notícias
              </h3>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {config.newsList.map((news: any, index: number) => {
                const isFirst = index === 0;
                return (
                  <div 
                    key={news.id || index} 
                    onClick={() => setSelectedNews(news)}
                    className={`bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-amber-300 hover:shadow-xl transition-all group flex flex-col cursor-pointer ${isFirst ? 'md:col-span-2 lg:col-span-2 row-span-2' : 'col-span-1'}`}
                  >
                    
                    <div className={`overflow-hidden relative flex-shrink-0 ${isFirst ? 'h-64 md:h-[400px]' : 'h-48 md:h-52'}`}>
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
                      <h4 className={`font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors mb-3 ${isFirst ? 'text-2xl md:text-4xl' : 'text-lg md:text-xl'}`}>
                        {news.title}
                      </h4>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 group-hover:text-amber-500 font-bold text-sm">
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
                    <div className="h-48 overflow-hidden relative">
                      <img src={post.image} alt="Post" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
                    
                    <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-1">
                      {post.content.length > 120 ? post.content.substring(0, 120) + '...' : post.content}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mt-auto">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-bold">{post.likes || 0}</span>
                      </div>
                      <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">
                        {post.category}
                      </span>
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
              className="fixed top-6 right-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] text-blue-600 hover:text-blue-800 rounded-full px-5 py-2.5 z-[110] transition-colors flex items-center gap-2 font-bold border border-slate-100"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar ao Início</span>
            </button>
            
            <div className="w-full h-[50vh] md:h-[65vh] relative">
              {selectedNews.image ? (
                <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-full object-cover" />
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
    </div>
  );
}
