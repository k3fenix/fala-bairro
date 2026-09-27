import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight, Users, Zap, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Landing() {
  const [config, setConfig] = useState({
    bgImage: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80',
    newsImg: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80',
    newsMain: 'Reunião de Segurança Comunitária define novas regras',
    newsSide1: 'Falta de Água na Rua 15 será resolvida amanhã',
    newsSide2: 'Nova feira de rua aos domingos confirmada'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const getVal = (k: string) => data.find(s => s.key === k)?.value;
      setConfig(prev => ({
        bgImage: getVal('landing_bg_image') || prev.bgImage,
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
      <div className="relative text-white overflow-hidden pb-40">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${config.bgImage}')` }}
        ></div>
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]"></div>

        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 relative z-10">
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
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-[1.15] tracking-tight">
              O que acontece no seu bairro, <br className="hidden md:block" />
              <span className="text-amber-400">a comunidade conta.</span>
            </h2>
            <p className="text-slate-200 text-lg md:text-xl mb-12 leading-relaxed font-medium">
              A primeira rede social exclusiva para vizinhos. Descubra notícias, compartilhe avisos e conecte-se com quem mora perto de você.
            </p>

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

      {/* Central News Highlights */}
      <div className="max-w-5xl mx-auto px-6 -mt-32 relative z-20 mb-20">
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-2 border-2 border-amber-400 transform transition-transform hover:-translate-y-1 duration-500">
          <div className="bg-slate-50 rounded-[1.5rem] p-4 md:p-6 overflow-hidden">
            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2 tracking-tight">
              <Zap className="w-6 h-6 text-amber-500" /> Últimas Notícias
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* Main News */}
              <div className="md:col-span-2 relative rounded-2xl overflow-hidden group h-64 md:h-80 cursor-pointer shadow-md">
                <img 
                  src={config.newsImg} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  alt="Notícia Principal" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent flex flex-col justify-end p-6">
                  <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md w-fit mb-2 tracking-widest">Destaque</span>
                  <h4 className="text-white text-2xl md:text-3xl font-bold leading-tight group-hover:text-amber-300 transition-colors">
                    {config.newsMain}
                  </h4>
                </div>
              </div>

              {/* Side Floating News */}
              <div className="flex flex-col gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col justify-center hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Aviso Urgente</span>
                  </div>
                  <h5 className="text-slate-800 font-bold leading-tight group-hover:text-blue-600 transition-colors">
                    {config.newsSide1}
                  </h5>
                </div>
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col justify-center hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Comunidade</span>
                  </div>
                  <h5 className="text-slate-800 font-bold leading-tight group-hover:text-blue-600 transition-colors">
                    {config.newsSide2}
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
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
  );
}
