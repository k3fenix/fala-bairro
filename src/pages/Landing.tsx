import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, ArrowRight, Heart, Users, Zap, ShieldCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-200">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-blue-700 via-blue-600 to-indigo-800 text-white overflow-hidden pb-32">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-400/30 blur-[100px] animate-pulse"></div>
          <div className="absolute top-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-400/20 blur-[120px]"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 blur-[100px]"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 relative z-10">
          {/* Header */}
          <div className="flex justify-center items-center gap-3 mb-16 animate-fade-in-down">
            <div className="bg-amber-400 p-2.5 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.4)]">
              <MessageCircle className="w-8 h-8 text-amber-950" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              FALA DO BAIRRO
            </h1>
          </div>
          
          {/* Main Copy */}
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-[1.15] tracking-tight">
              O que acontece no seu bairro, <br className="hidden md:block" />
              <span className="text-amber-400">a comunidade conta.</span>
            </h2>
            <p className="text-blue-100 text-lg md:text-xl mb-12 leading-relaxed font-medium">
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

      {/* Floating Mockup Section */}
      <div className="max-w-4xl mx-auto px-6 -mt-24 relative z-20 mb-20">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-1.5 border border-slate-100/50 backdrop-blur-xl transform transition-transform hover:-translate-y-1 duration-500">
          <div className="bg-slate-50 rounded-[1.75rem] p-6 md:p-8 border border-slate-100">
            <div className="flex items-center gap-2 text-blue-600 font-bold mb-6">
              <div className="bg-blue-600 shadow-md p-1.5 rounded-full text-white">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm uppercase tracking-widest font-black">Exemplo: Vila Rica</span>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full p-0.5 shadow-md">
                  <div className="w-full h-full bg-white rounded-full overflow-hidden border-2 border-white">
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white"></div>
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <p className="font-black text-slate-800 text-lg leading-none">João Silva</p>
                  <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-wide">Morador</span>
                </div>
                <p className="text-sm text-slate-500 mt-1 font-medium">@joaosilva • há 2 horas</p>
              </div>
            </div>

            <p className="text-slate-700 text-[17px] leading-relaxed font-medium">
              Pessoal, alguém sabe quando começa a reforma do muro do prédio na rua principal? Estão descarregando vários materiais na esquina desde cedo. Achei ótimo! 🏗️✨
            </p>

            <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" /> 24
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <MessageCircle className="w-5 h-5 text-blue-500" /> 5 respostas
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
