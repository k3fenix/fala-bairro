import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Landing.css';
import { type UserSession, getAuthUser } from '../lib/authHelper';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(contextUser);
  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [commercialGuide, setCommercialGuide] = useState<any[]>([]);
  const [lostPets, setLostPets] = useState<any[]>([]);
  const [allPets, setAllPets] = useState<any[]>([]);
  
  const [selectedPetDetails, setSelectedPetDetails] = useState<any>(null);
  const [selectedBusinessDetails, setSelectedBusinessDetails] = useState<any>(null);
  const [expandedBusinessImage, setExpandedBusinessImage] = useState<string | null>(null);
  const [selectedPostDetails, setSelectedPostDetails] = useState<any>(null);
  const [selectedNewsDetails, setSelectedNewsDetails] = useState<any>(null);
  const [isNewsFullScreen, setIsNewsFullScreen] = useState(false);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const AVAILABLE_CITIES = [
    'Todas as Cidades',
    "Santa Bárbara d'Oeste - SP",
    "Campinas - SP",
    "Americana - SP",
    "Sumaré - SP",
    "Nova Odessa - SP",
    "Hortolândia - SP",
    "Piracicaba - SP",
    "Limeira - SP"
  ];
  const [selectedCity, setSelectedCity] = useState<string>(() => localStorage.getItem('user_city') || 'Todas as Cidades');
  const [newsList, setNewsList] = useState<any[]>([]);

  const [sessionVotes, setSessionVotes] = useState<Record<string, boolean>>({});
  const [businessSearchTerm, setBusinessSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchNews();
    fetchPublicPosts();
    fetchCommercialGuide();
    fetchLostPets();
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await getAuthUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    if (contextUser) setCurrentUser(contextUser);
  }, [contextUser]);

  const defaultNews = [
    {
      id: '1',
      title: "Obras de recapeamento na Avenida Central começam nesta segunda-feira",
      summary: "Trânsito terá desvio temporário pela Rua das Flores durante toda a semana. Moradores devem ficar atentos às linhas de ônibus.",
      category: "Infraestrutura",
      neighborhood: "Mário Covas",
      image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80",
      date: "Hoje às 09:30",
      description: "A prefeitura regional iniciou nesta segunda-feira as obras de recapeamento asfáltico e sinalização na Avenida Central do bairro Mário Covas.\n\nO tráfego sofrerá intervenções parciais entre os cruzamentos com a Rua das Flores e Avenida dos Pioneiros. Agentes comunitários de trânsito estão no local orientando motoristas e pedestres.\n\nA previsão de conclusão dos serviços é de até 5 dias úteis, garantindo mais segurança e qualidade no trânsito para todos os moradores da nossa comunidade."
    },
    {
      id: '2',
      title: "Posto de Saúde do bairro terá mutirão de vacinação no próximo sábado",
      summary: "Atendimento das 8h às 17h para atualização da caderneta de crianças, jovens e idosos. Leve documento com foto.",
      category: "Saúde",
      neighborhood: "Mário Covas",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
      date: "Ontem",
      description: "A Unidade Básica de Saúde (UBS) do bairro Mário Covas realizará um mutirão especial de imunização neste sábado.\n\nEstarão disponíveis doses de vacinas contra a gripe (Influenza), Covid-19, tétano e todas as vacinas de rotina para bebês, crianças, adultos e idosos. O atendimento será contínuo das 08h às 17h.\n\nMoradores devem levar documento oficial com foto e a carteira de vacinação para conferência e atualização."
    },
    {
      id: '3',
      title: "Feira de produtores e artesanato local atrai mais de 400 famílias na praça",
      summary: "Evento valoriza feirantes do bairro e movimenta a economia local com opções gastronômicas e música ao vivo.",
      category: "Cultura",
      neighborhood: "Praça da Paz",
      image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80",
      date: "Há 2 dias",
      description: "A Praça da Paz recebeu neste fim de semana mais uma animada edição da Feira de Produtores e Artesãos Locais, reunindo centenas de vizinhos.\n\nCom barracas de hortaliças frescas, queijos artesanais, lanches, além de brinquedos infláveis e apresentações culturais, o evento movimentou os empreendedores da região.\n\nA próxima edição já está confirmada para o próximo mês. Prestigie e compre de quem produz no seu bairro!"
    }
  ];

  const fetchNews = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').eq('key', 'landing_news_list').maybeSingle();
      if (data && data.value) {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((item: any, idx: number) => ({
            id: item.id || String(idx),
            title: item.title,
            summary: item.description ? (item.description.length > 130 ? item.description.substring(0, 130) + '...' : item.description) : item.title,
            category: item.label || 'Notícia',
            city: item.city || 'Campinas - SP',
            neighborhood: item.city || 'Campinas - SP',
            image: item.image || defaultNews[idx % defaultNews.length].image,
            date: 'Publicado recentemente',
            description: item.description || item.title
          }));
          setNewsList(formatted);
          return;
        }
      }
    } catch (e) {
      console.log('Usando notícias padrão:', e);
    }
    setNewsList(defaultNews);
  };

  const fetchLostPets = async () => {
    const { data } = await supabase.from('lost_pets').select('*').order('created_at', { ascending: false });
    if (data) {
      setAllPets(data);
      setLostPets(data.filter(p => p.status === 'Perdido'));
    }
  };

  const fetchMarketplaceItems = async () => {
    const { data: listings } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false }).limit(6);
    const { data: items } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false }).limit(6);
    
    const combined: any[] = [];
    const seenTitles = new Set<string>();

    if (listings) {
      listings.forEach(d => {
        const titleKey = (d.title || '').trim().toLowerCase();
        if (titleKey) seenTitles.add(titleKey);
        combined.push({
          ...d,
          type: d.accepts_trade ? 'Troca' : (Number(d.price) === 0 ? 'Grátis' : 'Venda'),
          seller_whatsapp: d.whatsapp,
          image: d.image_url || d.image
        });
      });
    }

    if (items) {
      items.forEach(d => {
        const titleKey = (d.title || '').trim().toLowerCase();
        if (!seenTitles.has(titleKey)) {
          if (titleKey) seenTitles.add(titleKey);
          combined.push(d);
        }
      });
    }
  };


  const fetchCommercialGuide = async () => {
    const { data } = await supabase.from('commercial_guide').select('*').order('created_at', { ascending: false }).limit(24);
    if (data) setCommercialGuide(data);
  };

  const fetchPublicPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) {
      const approved = data.filter(p => p.is_approved === true || String(p.is_approved) === 'true').slice(0, 6);
      setPublicPosts(approved);
    }
  };

  const handleVote = async (postId: number, field: 'likes' | 'upvotes' | 'downvotes') => {
    const voteKey = `${postId}-${field}`;
    if (sessionVotes[voteKey]) return;
    setSessionVotes(prev => ({ ...prev, [voteKey]: true }));
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

  const shareText = (text: string) => {
    const url = encodeURIComponent(window.location.href);
    const msg = encodeURIComponent(`${text} - Veja no Fala do Bairro: `);
    window.open(`https://api.whatsapp.com/send?text=${msg}${url}`, '_blank');
  };

  const openWhatsApp = (phone: string, msg: string) => {
    const text = encodeURIComponent(msg);
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const filteredNews = newsList.filter(item => {
    if (!selectedCity || selectedCity === 'Todas as Cidades') return true;
    const target = selectedCity.toLowerCase().replace(' - sp', '').trim();
    const itemLocation = `${item.city || ''} ${item.neighborhood || ''}`.toLowerCase();
    return itemLocation.includes(target);
  });

  return (
    <div className="landing-container">
      {/* ==========================================================================
          CABEÇALHO PRINCIPAL
          ========================================================================== */}
      <header className="top-header">
        <div className="container top-header-inner">
          <Link to="/" className="brand" title="Fala do Bairro - Início">
            <img src="/logo-fala-bairro.svg" alt="Fala do Bairro" className="brand-logo-img" />
            <div className="brand-text">
              <h1>Fala do Bairro</h1>
              <span>PORTAL COMUNITÁRIO</span>
            </div>
          </Link>

          <div className="location-badge" title="Bairro Selecionado">
            <span>📍</span>
            <select 
              id="currentNeighborhood"
              value={selectedCity} 
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCity(val);
                localStorage.setItem('user_city', val);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ff5100',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
              aria-label="Escolher cidade para ver notícias"
            >
              {AVAILABLE_CITIES.map(c => (
                <option key={c} value={c} style={{ color: '#1e293b', fontWeight: 600 }}>
                  {c === 'Todas as Cidades' ? '🌟 ' + c : '📍 ' + c}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.7rem', color: '#ff5100' }}>▾</span>
          </div>

          <div className="header-search">
            <span className="header-search-icon">🔍</span>
            <input type="text" placeholder="Buscar notícias, avisos ou empresas..." aria-label="Buscar no bairro" />
          </div>

          <div className="header-actions">




            <a 
              href={import.meta.env.VITE_MARKETPLACE_URL || "/marketplace"} 
              className="btn-header-marketplace"
              title="Acessar Fala do Bairro Marketplace"
              target={import.meta.env.VITE_MARKETPLACE_URL ? "_blank" : "_self"}
              rel="noopener noreferrer"
            >
              🛒 <span>MARKETPLACE</span>
            </a>

            <Link 
              to={currentUser ? "/feed" : "/login"} 
              className="btn-header-auth" 
              title={currentUser ? `Conectado como ${currentUser.name}` : "Entrar"}
            >
              👤 <span>{currentUser ? currentUser.name : 'Entrar / Cadastrar'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sub-navegação rápida por categorias */}
      <nav className="subnav-chips" aria-label="Categorias rápidas">
        <div className="chips-wrapper">
          <a href="#inicio" className="chip active">🏠 Início</a>
          <a href="#alertas" className="chip">🚨 Alertas</a>
          <a href="#noticias" className="chip">📰 Notícias</a>
          <a href="#mural" className="chip">📢 Mural</a>
          <a href="#animais" className="chip">🐶 Animais</a>
          <a href="#guia" className="chip">🏪 Guia Local</a>
          <a 
            href={import.meta.env.VITE_MARKETPLACE_URL || "/marketplace"} 
            className="chip chip-marketplace"
            target={import.meta.env.VITE_MARKETPLACE_URL ? "_blank" : "_self"}
            rel="noopener noreferrer"
          >
            🛒 Marketplace
          </a>

        </div>
      </nav>

      <main className="container" id="inicio">

        {/* ==========================================================================
            SEÇÃO 1: ALERTAS URGENTES DO BAIRRO
            ========================================================================== */}
        {lostPets.length > 0 && (
          <section id="alertas" className="alerts-container">
            {lostPets.slice(0, 1).map(pet => (
              <div key={pet.id} className="alert-card-urgent">
                <div className="alert-card-content">
                  {pet.image ? (
                    <img
                      src={pet.image}
                      alt={pet.pet_name}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '2px solid #ef4444'
                      }}
                    />
                  ) : (
                    <div className="alert-badge-icon">🐶</div>
                  )}
                  <div className="alert-card-text">
                    <strong>ALERTA URGENTE DO BAIRRO</strong>
                    <p>{pet.pet_name} desapareceu</p>
                    <span>{pet.species} • Visto por último: {pet.last_seen_location}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedPetDetails(pet)} className="btn-alert-action">VER ALERTA</button>
              </div>
            ))}
          </section>
        )}

        {/* ==========================================================================
            SEÇÃO 2: NOTÍCIAS DO BAIRRO
            ========================================================================== */}
        <section id="noticias">
          <div className="section-header">
            <div>
              <h2 className="section-title">📰 Notícias da Cidade e Região</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{selectedCity === 'Todas as Cidades' ? 'Exibindo notícias de todas as cidades da região' : `Notícias selecionadas para: ${selectedCity}`}</p>
            </div>
            <Link to="/feed" className="section-link">Ver todas ➔</Link>
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', margin: '12px 0 18px 0' }} className="no-scrollbar">
            {AVAILABLE_CITIES.map(city => {
              const isSelected = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                    localStorage.setItem('user_city', city);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    border: isSelected ? '1px solid #ff5100' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isSelected ? '#ff5100' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    boxShadow: isSelected ? '0 3px 10px rgba(255, 81, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  {city === 'Todas as Cidades' ? '🌟 Todas as Cidades' : '📍 ' + city.replace(' - SP', '')}
                </button>
              );
            })}
          </div>

          <div className="news-grid">
            {filteredNews.length > 0 ? (
              filteredNews.map((item) => (
              <article 
                key={item.id} 
                className="news-card" 
                style={{ cursor: "pointer" }} 
                onClick={() => setSelectedNewsDetails(item)}
                title="Clique para ler a notícia completa"
              >
                {item.image && (
                  <img className="news-image" src={item.image} alt={item.title} loading="lazy" />
                )}
                <div className="news-body">
                  <div className="news-meta">
                    <span className="news-category">{item.category}</span>
                    <span className="news-neighborhood" style={{ color: '#ff5100', fontWeight: 700 }}>• 📍 {item.city || item.neighborhood}</span>
                  </div>
                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-summary">{item.summary}</p>
                  <div className="news-footer" style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.date}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>📖 Ler mais</span>
                      <button className="share-btn-inline" onClick={(e) => { e.stopPropagation(); shareText(item.title); }}>📤</button>
                    </div>
                  </div>
                </div>
              </article>
            ))
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600, margin: '0 0 12px 0' }}>
                  Nenhuma notícia recente cadastrada para <strong>{selectedCity}</strong> no momento.
                </p>
                <button 
                  type="button"
                  onClick={() => { setSelectedCity('Todas as Cidades'); localStorage.setItem('user_city', 'Todas as Cidades'); }}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  🌟 Ver notícias de todas as cidades
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'none' }}>
            <article className="news-card" style={{ cursor: "pointer" }} onClick={() => setSelectedNewsDetails({ title: "Obras de recapeamento na Avenida Central começam nesta segunda-feira", summary: "Trânsito terá desvio temporário pela Rua das Flores durante toda a semana. Moradores devem ficar atentos às linhas de ônibus.", category: "Infraestrutura", neighborhood: "Mário Covas", image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80", date: "Hoje às 09:30" })}>
              <img className="news-image" src="https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80" alt="Obras" loading="lazy" />
              <div className="news-body">
                <div className="news-meta">
                  <span className="news-category">Infraestrutura</span>
                  <span className="news-neighborhood">• Mário Covas</span>
                </div>
                <h3 className="news-title">Obras de recapeamento na Avenida Central começam nesta segunda-feira</h3>
                <p className="news-summary">Trânsito terá desvio temporário pela Rua das Flores durante toda a semana. Moradores devem ficar atentos às linhas de ônibus.</p>
                <div className="news-footer">
                  <span>Hoje às 09:30</span>
                  <button className="share-btn-inline" onClick={(e) => { e.stopPropagation(); shareText('Obras de recapeamento na Avenida Central'); }}>📤 Compartilhar</button>
                </div>
              </div>
            </article>

            <article className="news-card" style={{ cursor: "pointer" }} onClick={() => setSelectedNewsDetails({ title: "Posto de Saúde do bairro terá mutirão de vacinação no próximo sábado", summary: "Atendimento das 8h às 17h para atualização da caderneta de crianças, jovens e idosos. Leve documento com foto.", category: "Saúde", neighborhood: "Mário Covas", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80", date: "Ontem" })}>
              <img className="news-image" src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80" alt="Saúde" loading="lazy" />
              <div className="news-body">
                <div className="news-meta">
                  <span className="news-category">Saúde</span>
                  <span className="news-neighborhood">• Mário Covas</span>
                </div>
                <h3 className="news-title">Posto de Saúde do bairro terá mutirão de vacinação no próximo sábado</h3>
                <p className="news-summary">Atendimento das 8h às 17h para atualização da caderneta de crianças, jovens e idosos. Leve documento com foto.</p>
                <div className="news-footer">
                  <span>Ontem</span>
                  <button className="share-btn-inline" onClick={(e) => { e.stopPropagation(); shareText('Mutirão de vacinação no Posto de Saúde'); }}>📤 Compartilhar</button>
                </div>
              </div>
            </article>

            <article className="news-card" style={{ cursor: "pointer" }} onClick={() => setSelectedNewsDetails({ title: "Feira de produtores e artesanato local atrai mais de 400 famílias na praça", summary: "Evento valoriza feirantes do bairro e movimenta a economia local com opções gastronômicas e música ao vivo.", category: "Cultura", neighborhood: "Praça da Paz", image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80", date: "Há 2 dias" })}>
              <img className="news-image" src="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80" alt="Cultura" loading="lazy" />
              <div className="news-body">
                <div className="news-meta">
                  <span className="news-category">Cultura</span>
                  <span className="news-neighborhood">• Praça da Paz</span>
                </div>
                <h3 className="news-title">Feira de produtores e artesanato local atrai mais de 400 famílias na praça</h3>
                <p className="news-summary">Evento valoriza feirantes do bairro e movimenta a economia local com opções gastronômicas e música ao vivo.</p>
                <div className="news-footer">
                  <span>Há 2 dias</span>
                  <button className="share-btn-inline" onClick={(e) => { e.stopPropagation(); shareText('Feira de produtores na Praça da Paz'); }}>📤 Compartilhar</button>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ==========================================================================
            SEÇÃO 3: MURAL DO BAIRRO (Comunidade)
            ========================================================================== */}
        <section id="mural" style={{ marginTop: '32px' }}>
          <div className="mural-header-banner">
            <div className="mural-banner-text">
              <div>
                <h2>📢 MURAL DO BAIRRO</h2>
                <p>"Converse com seus vizinhos e compartilhe informações da comunidade."</p>
              </div>
              <Link to="/feed" className="btn-publish-main" style={{ background: '#fff', color: 'var(--primary)', alignSelf: 'flex-start', marginTop: '8px' }}>
                + PUBLICAR NO MURAL
              </Link>
            </div>
          </div>

          <div className="mural-grid">
            {publicPosts.map(post => (
              <div key={post.id} onClick={() => setSelectedPostDetails(post)} className="mural-card-compact" title="Clique para ver a postagem completa">
                <div className="animal-image-wrap">
                  {post.image ? (
                    <img src={post.image} alt={post.author_name} className="animal-img" loading="lazy" />
                  ) : (
                    <div className="mural-card-no-img">
                      <span style={{ fontSize: '2.5rem' }}>📢</span>
                    </div>
                  )}
                  <span className={`post-badge-floating ${post.category === 'Aviso' ? 'badge-aviso' : post.category === 'Alerta' ? 'badge-alerta' : 'badge-evento'}`}>
                    {post.category || 'Mural'}
                  </span>
                </div>
                <div className="mural-compact-body">
                  <div className="mural-card-author">
                  <div className="author-info">
                    <img src={post.author_avatar} alt="" className="author-avatar" style={{ objectFit: 'cover' }} />
                    <div className="author-details">
                      <h4>{post.author_name}</h4>
                      <span>{post.neighborhood} • {new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>



                </div>

                <p className="mural-compact-text">{post.content}</p>
                <div className="mural-card-footer">
                  <div className="post-action-group">
                    <button className="mural-pill-stat" onClick={(e) => { e.stopPropagation(); handleVote(post.id, 'likes'); }} title="Curtir">
                      <span className="stat-emoji">👍</span> <strong>{post.likes || 0}</strong>
                    </button>
                    <button className="mural-pill-stat" onClick={(e) => { e.stopPropagation(); setSelectedPostDetails(post); }} title="Comentários">
                      <span className="stat-emoji">💬</span> <strong>{post.comments?.length || 0}</strong>
                    </button>
                  </div>
                  <span className="mural-view-link">Ver postagem ➔</span>
                  <div style={{ display: 'none' }}>
                    <button className="btn-action-ghost" onClick={(e) => { e.stopPropagation(); shareText(`Publicação de ${post.author_name} no Mural`); }}>📤 Compartilhar</button>
                  </div>
                </div>
              </div>
              </div>
            ))}
            
            {publicPosts.length === 0 && (
              <div className="post-card" style={{ textAlign: 'center', padding: '40px' }}>
                <p>Nenhuma publicação no mural ainda.</p>
              </div>
            )}
          </div>
        </section>

        {/* ==========================================================================
            SEÇÃO 4: ANIMAIS
            ========================================================================== */}
        <section id="animais" style={{ marginTop: '36px' }}>
          <div className="section-header">
            <h2 className="section-title">🐾 Animais no Bairro</h2>
            <Link to="/feed" className="section-link">Ver mural pet ➔</Link>
          </div>

          <div className="animals-grid">
            {allPets.slice(0, 3).map(pet => (
              <div key={pet.id} onClick={() => setSelectedPetDetails(pet)} className="animal-card" style={{ cursor: "pointer" }}>
                <div className="animal-image-wrap">
                  {pet.image ? (
                    <img className="animal-img" src={pet.image} alt={pet.pet_name} loading="lazy" />
                  ) : (
                    <div className="animal-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🐾</div>
                  )}
                  <span className={`animal-status-tag ${pet.status === 'Perdido' ? 'status-perdido' : pet.status === 'Encontrado' || pet.status === 'Achado' ? 'status-encontrado' : 'status-adocao'}`}>
                    {pet.status === 'Perdido' ? '🚨 PERDIDO' : pet.status === 'Encontrado' || pet.status === 'Achado' ? '🐾 ENCONTRADO' : '❤️ ADOÇÃO'}
                  </span>
                </div>
                <div className="animal-info">
                  <h3>{pet.pet_name}</h3>
                  <p className="animal-sub">📍 {pet.species} • {pet.last_seen_location}</p>
                  <p className="animal-desc" title={pet.description}>{pet.description}</p>
                  <button className="btn-contact-whatsapp" onClick={(e) => { e.stopPropagation(); openWhatsApp(pet.owner_whatsapp, `Olá, vi o anúncio sobre o ${pet.pet_name} no Fala do Bairro!`); }} title="Falar no WhatsApp">
                    💬 Falar no WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================================================
            SEÇÃO 5: GUIA LOCAL & COMÉRCIO DO BAIRRO
            ========================================================================== */}
        {/* ==========================================================================
            DIVISOR: ANIMAIS -> EMPRESÁRIOS LOCAIS
            ========================================================================== */}
        <div className="section-divider-bar">
          <span className="section-divider-badge">🏪 COMÉRCIO & EMPRESÁRIOS LOCAIS</span>
        </div>

        <section id="guia" style={{ marginTop: '20px' }}>
          <div className="business-header-banner">
            <div className="banner-content">
            <div>
                <h2>🏪 EMPRESÁRIOS LOCAIS & GUIA COMERCIAL</h2>
                <p>"Fortaleça o comércio da sua comunidade! Encontre comércios, serviços e profissionais da sua cidade e bairro."</p>
            </div>
            <Link to="/feed" className="btn-banner-action">+ CADASTRAR EMPRESA</Link>
          </div>
          </div>

          <div className="guia-search-box">
            <div className="guia-search-input-wrap">
              <input 
                type="text" 
                value={businessSearchTerm}
                onChange={(e) => setBusinessSearchTerm(e.target.value)}
                placeholder="🔎 O que você procura? Padaria, mecânico, lanchonete..." 
                aria-label="Buscar comércio local" 
              />
              <button type="button">Buscar</button>
            </div>
          </div>

          <div className="business-grid">
            {commercialGuide
              .filter(b => {
                if (!businessSearchTerm.trim()) return true;
                const t = businessSearchTerm.toLowerCase();
                return (
                  (b.name || '').toLowerCase().includes(t) ||
                  (b.category || '').toLowerCase().includes(t) ||
                  (b.description || '').toLowerCase().includes(t) ||
                  (b.neighborhood || '').toLowerCase().includes(t)
                );
              })
              .map(business => (
              <div key={business.id} onClick={() => setSelectedBusinessDetails(business)} className="business-card" style={{ cursor: "pointer" }}>
                {business.image ? (
                  <img 
                    className="business-thumb" 
                    src={business.image} 
                    alt={business.name} 
                    loading="lazy" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80';
                    }}
                  />
                ) : (
                  <div className="business-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', background: 'rgba(255, 255, 255, 0.2)' }}>🏪</div>
                )}
                <div className="business-details">
                  <span className="business-category">{business.category}</span>
                  <h4>{business.name}</h4>
                  <p className="business-address">{business.description || 'Comércio e serviços no bairro'}</p>
                  <button className="btn-business-cta" onClick={(e) => { e.stopPropagation(); openWhatsApp(business.whatsapp, `Olá ${business.name}, vi o anúncio no Fala do Bairro!`); }}>
                    <span>💬</span> WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>





























      </main>

      {/* ==========================================================================
          RODAPÉ INSTITUCIONAL
          ========================================================================== */}
      <footer className="footer-site">
        <div className="container">
          <div className="footer-content">
            <div className="footer-about">
              <div className="footer-brand-title">
                <img src="/logo-fala-bairro.svg" alt="Fala do Bairro" className="footer-logo-img" />
                <h3>Fala do Bairro</h3>
              </div>
              <p>Plataforma comunitária independente feita para conectar vizinhos, dar voz aos acontecimentos locais, resgatar animais e fortalecer os pequenos negócios da região.</p>
            </div>
            <div className="footer-links">
              <h4>Navegação</h4>
              <ul style={{ padding: 0 }}>
                <li><a href="#noticias">Notícias Locais</a></li>
                <li><a href="#mural">Mural da Comunidade</a></li>
                <li><a href="#animais">Animais Perdidos</a></li>
                <li><a href="#guia">Guia de Empresas</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Ajuda & Segurança</h4>
              <ul style={{ padding: 0 }}>
                <li><a href="#">Regras da Comunidade</a></li>
                <li><a href="#">Termos de Uso</a></li>
                <li><a href="#">Política de Privacidade</a></li>
                <li><a href="#">Como anunciar no Bairro</a></li>
                <li><a href="#">Fale com a Moderação</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>&copy; 2026 Fala do Bairro (www.faladobairro.online) — Todos os direitos reservados.</span>
            <span>Feito com orgulho para fortalecer a nossa comunidade local.</span>
          </div>
        </div>
      </footer>

      {/* Pet Details Modal */}
      {selectedPetDetails && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPetDetails(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '28rem', maxHeight: '90vh', overflowY: 'auto' }}>
            {selectedPetDetails.image && (
              <div className="w-full h-64 bg-slate-100" style={{ width: '100%', height: '16rem', backgroundColor: '#f1f5f9' }}>
                <img src={selectedPetDetails.image} alt="Pet" className="w-full h-full object-cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div className="p-6" style={{ padding: '24px' }}>
              <div className="flex justify-between items-start mb-4" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 className="text-2xl font-bold text-slate-800" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedPetDetails.pet_name}</h2>
                <button onClick={() => setSelectedPetDetails(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200" style={{ padding: '8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                  X
                </button>
              </div>
              <p className="text-slate-600 mb-2"><strong>Status:</strong> {selectedPetDetails.status}</p>
              <p className="text-slate-600 mb-2"><strong>Espécie:</strong> {selectedPetDetails.species}</p>
              <p className="text-slate-600 mb-2"><strong>Visto por último:</strong> {selectedPetDetails.last_seen_location}</p>
              {selectedPetDetails.description && (
                <div className="bg-slate-50 p-4 rounded-xl mt-4" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedPetDetails.description}</p>
                </div>
              )}
              {selectedPetDetails.owner_whatsapp && (
                <a href={"https://wa.me/" + String(selectedPetDetails.owner_whatsapp).replace(/\D/g, '')} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 bg-green-500 text-white w-full py-3 rounded-xl font-bold hover:bg-green-600 transition-colors" style={{ display: 'block', marginTop: '24px', backgroundColor: '#22c55e', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
                  Falar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Business Details Modal */}
      {selectedBusinessDetails && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedBusinessDetails(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '36rem', maxHeight: '90vh', overflowY: 'auto' }}>
            {selectedBusinessDetails.image && (
              <div 
                className="w-full h-72 bg-slate-900 relative cursor-pointer group overflow-hidden flex items-center justify-center"
                onClick={() => setExpandedBusinessImage(selectedBusinessDetails.image)}
                title="Clique para ver foto / panfleto em tela cheia"
              >
                <img 
                  src={selectedBusinessDetails.image} 
                  alt={selectedBusinessDetails.name} 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                  onError={(e) => {
                    (e.target as HTMLElement).parentElement!.style.display = 'none';
                  }}
                />
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-bold shadow">
                  🔍 Ampliar Foto / Panfleto
                </div>
              </div>
            )}
            <div className="p-6" style={{ padding: '24px' }}>
              <div className="flex justify-between items-start mb-4" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 className="text-2xl font-bold text-slate-800" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedBusinessDetails.name}</h2>
                <button onClick={() => setSelectedBusinessDetails(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200" style={{ padding: '8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                  X
                </button>
              </div>
              <p className="text-blue-600 font-bold mb-4" style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '16px' }}>{selectedBusinessDetails.category}</p>
              <p className="text-slate-600 mb-2"><strong>Bairro:</strong> {selectedBusinessDetails.neighborhood}</p>
              {selectedBusinessDetails.description && (
                <div className="bg-slate-50 p-4 rounded-xl mt-4" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedBusinessDetails.description}</p>
                </div>
              )}
              {selectedBusinessDetails.whatsapp && (
                <a href={"https://wa.me/" + String(selectedBusinessDetails.whatsapp).replace(/\D/g, '')} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 bg-green-500 text-white w-full py-3 rounded-xl font-bold hover:bg-green-600 transition-colors" style={{ display: 'block', marginTop: '24px', backgroundColor: '#22c55e', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
                  Falar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Foto / Panfleto em Tela Cheia */}
      {expandedBusinessImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4" 
          onClick={() => setExpandedBusinessImage(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="relative max-w-5xl max-h-[96vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setExpandedBusinessImage(null)} 
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white rounded-full px-4 py-2 font-extrabold text-sm transition flex items-center gap-1.5"
              style={{ cursor: 'pointer', border: 'none' }}
              title="Fechar"
            >
              ✕ Fechar Foto / Panfleto
            </button>
            <img 
              src={expandedBusinessImage} 
              alt="Panfleto Expandido" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            />
          </div>
        </div>
      )}

      {/* Post Details Modal */}
      {selectedPostDetails && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPostDetails(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '48rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: 'white' }}>
              <h2 className="font-bold text-lg">Detalhes da Publicação</h2>
              <button onClick={() => setSelectedPostDetails(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full hover:bg-slate-200" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
            <div className="p-6" style={{ padding: '24px' }}>
              <div className="flex items-center gap-3 mb-4" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <img src={selectedPostDetails.author_avatar || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-12 h-12 rounded-full object-cover" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <p className="font-bold text-slate-800" style={{ fontWeight: 'bold', margin: 0 }}>{selectedPostDetails.author_name}</p>
                  <p className="text-xs text-slate-500" style={{ fontSize: '0.75rem', margin: 0, color: '#64748b' }}>{selectedPostDetails.category}</p>
                </div>
              </div>
              <p className="text-slate-800 whitespace-pre-wrap text-lg leading-relaxed mb-4" style={{ fontSize: '1.125rem', color: '#334155', lineHeight: '1.7', marginBottom: '16px' }}>{selectedPostDetails.content}</p>
              {selectedPostDetails.image && (
                <img src={selectedPostDetails.image} alt="Post" className="w-full rounded-2xl mb-4 max-h-[500px] object-cover" style={{ width: '100%', borderRadius: '16px', maxHeight: '500px', objectFit: 'cover' }} />
              )}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <Link to="/feed" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition">
                  💬 Abrir Discussão no Feed
                </Link>
                <button onClick={() => setSelectedPostDetails(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Details Modal (Expanded Reader View) */}
      {selectedNewsDetails && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 transition-all duration-300"
          onClick={() => setSelectedNewsDetails(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 150, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            className={`bg-white shadow-2xl flex flex-col transition-all duration-300 ${isNewsFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl max-h-[96vh] sm:rounded-3xl overflow-hidden'}`}
            onClick={e => e.stopPropagation()} 
            style={{ 
              backgroundColor: 'white', 
              width: isNewsFullScreen ? '100vw' : '100%', 
              maxWidth: isNewsFullScreen ? '100vw' : '1050px', 
              height: isNewsFullScreen ? '100vh' : 'auto', 
              maxHeight: isNewsFullScreen ? '100vh' : '95vh', 
              borderRadius: isNewsFullScreen ? '0' : '24px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Top Bar / Reader Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 20 }}>
              <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="bg-blue-600 text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: '0.75rem', padding: '4px 12px', borderRadius: '9999px' }}>
                  {selectedNewsDetails.category || 'Notícia Local'}
                </span>
                <span className="text-sm font-semibold text-slate-500 hidden sm:inline" style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  📍 {selectedNewsDetails.neighborhood || 'Bairro'} • Fala Bairro Notícias
                </span>
              </div>

              <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsNewsFullScreen(!isNewsFullScreen)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  title={isNewsFullScreen ? "Restaurar tamanho" : "Expandir tela cheia"}
                  style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', color: '#334155' }}
                >
                  {isNewsFullScreen ? '📉 Tela Padrão' : '⛶ Tela Cheia'}
                </button>

                <button 
                  onClick={() => setSelectedNewsDetails(null)} 
                  className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-full font-bold transition" 
                  title="Fechar Notícia"
                  style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main Article Scrollable Body */}
            <div className="flex-1 overflow-y-auto" style={{ overflowY: 'auto', flex: 1, paddingBottom: '32px' }}>
              {/* Hero Image */}
              {selectedNewsDetails.image && (
                <div className="w-full relative bg-slate-900 overflow-hidden" style={{ width: '100%', maxHeight: isNewsFullScreen ? '480px' : '380px', backgroundColor: '#0f172a' }}>
                  <img 
                    src={selectedNewsDetails.image} 
                    alt={selectedNewsDetails.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                    style={{ width: '100%', height: '100%', maxHeight: isNewsFullScreen ? '480px' : '380px', objectFit: 'cover' }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                </div>
              )}

              {/* Article Content Container */}
              <div className="max-w-3xl mx-auto px-6 py-8" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
                {/* Meta details bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 text-slate-500 text-sm" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px', fontSize: '0.875rem', color: '#64748b' }}>
                  <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="font-semibold text-sky-700" style={{ fontWeight: '700', color: '#0369a1' }}>📍 {selectedNewsDetails.city || selectedNewsDetails.neighborhood || 'Região'}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700" style={{ fontWeight: '600', color: '#334155' }}>🗓️ {selectedNewsDetails.date || 'Hoje'}</span>
                    <span>•</span>
                    <span>⏱️ 2 min de leitura</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: selectedNewsDetails.title, text: selectedNewsDetails.summary, url: window.location.href }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(`${selectedNewsDetails.title} - ${selectedNewsDetails.summary}`);
                        alert('Link da notícia copiado!');
                      }
                    }}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                    style={{ color: '#2563eb', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    📤 Compartilhar Notícia
                  </button>
                </div>

                {/* Article Main Headline */}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6" style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.25', marginBottom: '24px' }}>
                  {selectedNewsDetails.title}
                </h1>

                {/* Lead Summary Box */}
                <div className="p-5 bg-blue-50/70 border-l-4 border-blue-600 rounded-r-2xl mb-8" style={{ padding: '20px', backgroundColor: '#eff6ff', borderLeft: '4px solid #2563eb', borderRadius: '0 16px 16px 0', marginBottom: '32px' }}>
                  <p className="text-slate-800 text-lg sm:text-xl font-medium leading-relaxed" style={{ fontSize: '1.2rem', color: '#1e293b', lineHeight: '1.7', margin: 0 }}>
                    {selectedNewsDetails.summary}
                  </p>
                </div>

                {/* Rich Body Paragraphs */}
                <div className="article-body space-y-6 text-slate-700 text-lg leading-relaxed" style={{ fontSize: '1.125rem', color: '#334155', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                  {selectedNewsDetails.description ? (
                    <p style={{ marginBottom: '16px' }}>{selectedNewsDetails.description}</p>
                  ) : (
                    <>
                  <p>
                    Acompanhe os detalhes atualizados e novidades importantes enviadas diretamente pela comunidade e equipes locais do bairro. Moradores e comerciantes do <strong>{selectedNewsDetails.neighborhood || 'bairro'}</strong> contam com atualizações em tempo real no portal Fala Bairro.
                  </p>

                  <p>
                    Fique atento aos prazos e programações indicadas. Para dúvidas ou orientações adicionais, você pode compartilhar este boletim com vizinhos e grupos locais do seu bairro.
                  </p>
                    </>
                  )}
                </div>

                {/* Action Footer */}
                <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-4 items-center justify-between" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                  <div className="flex gap-3" style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => {
                        const text = `📰 *${selectedNewsDetails.title}*\n\n${selectedNewsDetails.summary}\n\nVia Fala Bairro`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                      style={{ padding: '12px 20px', backgroundColor: '#059669', color: 'white', fontWeight: 'bold', borderRadius: '16px', border: 'none', cursor: 'pointer' }}
                    >
                      💬 Enviar no WhatsApp
                    </button>
                  </div>

                  <button 
                    onClick={() => setSelectedNewsDetails(null)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition"
                    style={{ padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 'bold', borderRadius: '16px', border: 'none', cursor: 'pointer' }}
                  >
                    Fechar Leitura
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ==========================================================================
          MODAL DE PUBLICAÇÃO
          ========================================================================== */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowPublishModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">O que você quer publicar?</h3>
                <p className="text-sm text-slate-500 mt-1">Escolha uma das opções abaixo</p>
              </div>
              <button onClick={() => setShowPublishModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-4 grid grid-cols-1 gap-2">
              <Link to="/feed" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📝</div>
                <div>
                  <h4 className="font-bold text-slate-800">Postagem</h4>
                  <p className="text-xs text-slate-500">Comunique-se com seus vizinhos</p>
                </div>
              </Link>
              
              <Link to="/feed" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🚨</div>
                <div>
                  <h4 className="font-bold text-slate-800">Alerta Urgente</h4>
                  <p className="text-xs text-slate-500">Avisos de segurança ou utilidade pública</p>
                </div>
              </Link>

              <button 
                onClick={() => {
                  setShowPublishModal(false);
                  window.location.href = '/marketplace';
                }}
                className="w-full text-left flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛍️</div>
                <div>
                  <h4 className="font-bold text-slate-800">Marketplace Independente</h4>
                  <p className="text-xs text-slate-500">Acesse a plataforma de compras e vendas</p>
                </div>
              </button>

              <Link to="/feed" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🐶</div>
                <div>
                  <h4 className="font-bold text-slate-800">Animal Perdido</h4>
                  <p className="text-xs text-slate-500">Ajude a encontrar pets perdidos</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
