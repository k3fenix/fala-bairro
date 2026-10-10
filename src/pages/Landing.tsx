import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Landing.css';

export default function Landing() {
  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [commercialGuide, setCommercialGuide] = useState<any[]>([]);
  const [lostPets, setLostPets] = useState<any[]>([]);
  const [allPets, setAllPets] = useState<any[]>([]);
  
  const [selectedPetDetails, setSelectedPetDetails] = useState<any>(null);
  const [selectedBusinessDetails, setSelectedBusinessDetails] = useState<any>(null);
  const [selectedPostDetails, setSelectedPostDetails] = useState<any>(null);
  const [selectedNewsDetails, setSelectedNewsDetails] = useState<any>(null);
  const [isNewsFullScreen, setIsNewsFullScreen] = useState(false);
  const [selectedMarketDetails, setSelectedMarketDetails] = useState<any>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [sessionVotes, setSessionVotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPublicPosts();
    fetchCommercialGuide();
    fetchLostPets();
    fetchMarketplaceItems();
  }, []);

  const fetchLostPets = async () => {
    const { data } = await supabase.from('lost_pets').select('*').order('created_at', { ascending: false });
    if (data) {
      setAllPets(data);
      setLostPets(data.filter(p => p.status === 'Perdido'));
    }
  };

  const fetchMarketplaceItems = async () => {
    const { data } = await supabase.from('marketplace_items').select('*').eq('status', 'Ativo').order('created_at', { ascending: false }).limit(6);
    if (data) setMarketplaceItems(data);
  };

  const fetchCommercialGuide = async () => {
    const { data } = await supabase.from('commercial_guide').select('*').limit(6);
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

  return (
    <div className="landing-container">
      {/* ==========================================================================
          CABEÇALHO PRINCIPAL
          ========================================================================== */}
      <header className="top-header">
        <div className="container top-header-inner">
          <Link to="/" className="brand" title="Fala do Bairro - Início">
            <div className="brand-icon">FB</div>
            <div className="brand-text">
              <h1>Fala do Bairro</h1>
              <span>PORTAL COMUNITÁRIO</span>
            </div>
          </Link>

          <div className="location-badge" title="Bairro Selecionado">
            📍 <span id="currentNeighborhood">Bairro Mário Covas</span> ▾
          </div>

          <div className="header-search">
            <span className="header-search-icon">🔍</span>
            <input type="text" placeholder="Buscar notícias, avisos ou empresas..." aria-label="Buscar no bairro" />
          </div>

          <div className="header-actions">
            <Link 
              to="/marketplace" 
              className="btn-publish-main" 
              style={{ backgroundColor: '#ff6500', color: '#ffffff', textDecoration: 'none' }}
              title="Acessar o Marketplace"
            >
              🛒 <span className="hidden sm:inline">Marketplace</span>
            </Link>
            <button onClick={() => setShowPublishModal(true)} className="btn-publish-main">
              + <span className="hidden sm:inline">Publicar</span>
            </button>
            <Link to="/register" className="btn-header-profile" title="Entrar ou Cadastrar">
              👤 <span className="hidden sm:inline">Entrar / Cadastrar</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sub-navegação rápida por categorias */}
      <nav className="subnav-chips" aria-label="Categorias rápidas">
        <div className="chips-wrapper">
          <a href="#inicio" className="chip active">🏠 Tudo</a>
          <a href="#alertas" className="chip">🚨 Alertas</a>
          <a href="#noticias" className="chip">📰 Notícias</a>
          <a href="#mural" className="chip">📢 Mural</a>
          <a href="#animais" className="chip">🐶 Animais</a>
          <a href="#guia" className="chip">🏪 Guia Local</a>
          <a href="#vendas" className="chip">🛒 Marketplace</a>
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
                  <div className="alert-badge-icon">🐶</div>
                  <div className="alert-card-text">
                    <strong>ALERTA URGENTE DO BAIRRO</strong>
                    <p>{pet.pet_name} desapareceu</p>
                    <span>{pet.species} • Visto por último: {pet.last_seen_location}</span>
                  </div>
                </div>
                <Link to="/feed" className="btn-alert-action">VER ALERTA</Link>
              </div>
            ))}
          </section>
        )}

        {/* ==========================================================================
            SEÇÃO 2: NOTÍCIAS DO BAIRRO
            ========================================================================== */}
        <section id="noticias">
          <div className="section-header">
            <h2 className="section-title">📰 Notícias do Bairro</h2>
            <Link to="/feed" className="section-link">Ver todas ➔</Link>
          </div>

          <div className="news-grid">
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

          <div className="mural-feed">
            {publicPosts.map(post => (
              <div key={post.id} onClick={() => setSelectedPostDetails(post)} className="post-card" style={{ cursor: "pointer" }}>
                <div className="post-author">
                  <div className="author-info">
                    <img src={post.author_avatar} alt="" className="author-avatar" style={{ objectFit: 'cover' }} />
                    <div className="author-details">
                      <h4>{post.author_name}</h4>
                      <span>{post.neighborhood} • {new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`post-badge ${post.category === 'Aviso' ? 'badge-aviso' : post.category === 'Alerta' ? 'badge-alerta' : 'badge-evento'}`}>
                    {post.category}
                  </span>
                </div>
                {post.image && <img src={post.image} alt="Publicação" style={{ width: '100%', borderRadius: '8px', marginBottom: '12px', objectFit: 'cover', maxHeight: '300px' }} />}
                <p className="post-text">{post.content}</p>
                <div className="post-actions">
                  <div className="post-action-group">
                    <button className="btn-action-ghost" onClick={(e) => { e.stopPropagation(); handleVote(post.id, 'likes'); }}>👍 <span>{post.likes || 0} curtidas</span></button>
                    <Link to="/feed" onClick={(e) => e.stopPropagation()} className="btn-action-ghost">💬 {post.comments?.length || 0} comentários</Link>
                  </div>
                  <div className="post-action-group">
                    <button className="btn-action-ghost" onClick={(e) => { e.stopPropagation(); shareText(`Publicação de ${post.author_name} no Mural`); }}>📤 Compartilhar</button>
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
                  <p className="animal-sub">{pet.species} • {pet.last_seen_location}</p>
                  <p className="animal-desc">{pet.description}</p>
                  <button className="btn-contact-whatsapp" onClick={(e) => { e.stopPropagation(); openWhatsApp(pet.owner_whatsapp, `Olá, vi o anúncio sobre o ${pet.pet_name} no Fala do Bairro!`); }}>
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
        <section id="guia" style={{ marginTop: '36px' }}>
          <div className="section-header">
            <h2 className="section-title">🏪 Encontre no seu Bairro</h2>
            <Link to="/feed" className="section-link">Cadastrar empresa ➔</Link>
          </div>

          <div className="guia-search-box">
            <div className="guia-search-input-wrap">
              <input type="text" placeholder="🔎 O que você procura? Padaria, mecânico..." aria-label="Buscar comércio local" />
              <button type="button">Buscar</button>
            </div>
          </div>

          <div className="business-grid">
            {commercialGuide.map(business => (
              <div key={business.id} onClick={() => setSelectedBusinessDetails(business)} className="business-card" style={{ cursor: "pointer" }}>
                {business.image ? (
                  <img className="business-thumb" src={business.image} alt={business.name} loading="lazy" />
                ) : (
                  <div className="business-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏪</div>
                )}
                <div className="business-details">
                  <span className="business-category">{business.category}</span>
                  <h4>{business.name}</h4>
                  <p className="business-address" style={{ fontSize: '11px' }}>{business.description?.substring(0, 40)}...</p>
                  <button className="btn-business-cta" onClick={(e) => { e.stopPropagation(); openWhatsApp(business.whatsapp, `Olá ${business.name}, vi o anúncio no Fala do Bairro!`); }}>📱 WhatsApp</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================================================
            SEÇÃO 6: VENDAS & TROCAS
            ========================================================================== */}
        <section id="vendas" style={{ marginTop: '36px' }}>
          <div className="section-header">
            <h2 className="section-title">🛒 Fala do Bairro Marketplace</h2>
            <Link to="/marketplace" className="section-link">Explorar Marketplace ➔</Link>
          </div>

          <div className="market-filter-bar">
            <button className="market-filter-btn active">TODOS</button>
            <button className="market-filter-btn">🏷️ VENDAS</button>
            <button className="market-filter-btn">🔄 TROCAS</button>
            <button className="market-filter-btn">🎁 GRÁTIS / DOAÇÃO</button>
          </div>

          <div className="market-grid">
            {marketplaceItems.map(item => (
              <div key={item.id} onClick={() => setSelectedMarketDetails(item)} className="market-card" style={{ cursor: "pointer" }}>
                <div className="market-img-wrap">
                  {item.image ? (
                    <img className="market-img" src={item.image} alt={item.title} loading="lazy" />
                  ) : (
                    <div className="market-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  )}
                  <span className={`market-type-tag ${item.type === 'Venda' ? 'tag-venda' : item.type === 'Troca' ? 'tag-troca' : 'tag-gratis'}`}>
                    {item.type}
                  </span>
                </div>
                <div className="market-info">
                  <div className="market-price">
                    {item.type === 'Troca' || item.type === 'Trocas' ? (
                      <span style={{ color: '#9333ea', fontWeight: '800', fontSize: '0.88rem' }}>🔄 Para Troca</span>
                    ) : item.type === 'Grátis' || item.type === 'Grátis/Doação' ? (
                      <span style={{ color: '#16a34a', fontWeight: '800', fontSize: '0.88rem' }}>🎁 Grátis</span>
                    ) : (
                      `R$ ${item.price}`
                    )}
                  </div>
                  <div className="market-title">{item.title}</div>
                  <div className="market-meta">
                    <span>{item.neighborhood}</span>
                    <button onClick={(e) => { e.stopPropagation(); openWhatsApp(item.seller_whatsapp, `Olá, vi o anúncio: ${item.title} no Fala do Bairro!`); }} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "bold" }}>Contatar</button>
                  </div>
                </div>
              </div>
            ))}
            
            {marketplaceItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <p>Nenhum anúncio disponível no momento.</p>
              </div>
            )}
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
              <h3>Fala do Bairro</h3>
              <p>Plataforma comunitária independente feita para conectar vizinhos, dar voz aos acontecimentos locais, resgatar animais e fortalecer os pequenos negócios da região.</p>
            </div>
            <div className="footer-links">
              <h4>Navegação</h4>
              <ul style={{ padding: 0 }}>
                <li><a href="#noticias">Notícias Locais</a></li>
                <li><a href="#mural">Mural da Comunidade</a></li>
                <li><a href="#animais">Animais Perdidos</a></li>
                <li><a href="#guia">Guia de Empresas</a></li>
                <li><a href="#vendas">Vendas e Trocas</a></li>
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
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '28rem', maxHeight: '90vh', overflowY: 'auto' }}>
            {selectedBusinessDetails.image && (
              <div className="w-full h-64 bg-slate-100" style={{ width: '100%', height: '16rem', backgroundColor: '#f1f5f9' }}>
                <img src={selectedBusinessDetails.image} alt="Business" className="w-full h-full object-cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <div className="article-body space-y-6 text-slate-700 text-lg leading-relaxed" style={{ fontSize: '1.125rem', color: '#334155', lineHeight: '1.8' }}>
                  <p>
                    Acompanhe os detalhes atualizados e novidades importantes enviadas diretamente pela comunidade e equipes locais do bairro. Moradores e comerciantes do <strong>{selectedNewsDetails.neighborhood || 'bairro'}</strong> contam com atualizações em tempo real no portal Fala Bairro.
                  </p>

                  <p>
                    Fique atento aos prazos e programações indicadas. Para dúvidas ou orientações adicionais, você pode compartilhar este boletim com vizinhos e grupos locais do seu bairro.
                  </p>
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

      {/* Marketplace Details Modal */}
      {selectedMarketDetails && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedMarketDetails(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '28rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: 'white' }}>
              <h2 className="font-bold text-lg" style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>Detalhes do Anúncio</h2>
              <button onClick={() => setSelectedMarketDetails(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200" style={{ padding: '8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                X
              </button>
            </div>
            {selectedMarketDetails.image && (
              <div className="w-full h-64 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                <img src={selectedMarketDetails.image} alt="" className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110" />
                <img src={selectedMarketDetails.image} alt={selectedMarketDetails.title} className="relative z-10 max-h-full max-w-full object-contain p-2 drop-shadow-xl" />
                <div className="absolute top-3 left-3 z-20">
                  <span className={`px-3 py-1.5 rounded-xl font-extrabold text-xs uppercase shadow-md backdrop-blur-md ${selectedMarketDetails.type === 'Troca' || selectedMarketDetails.type === 'Trocas' ? 'bg-purple-600/95 text-white' : selectedMarketDetails.type === 'Grátis' || selectedMarketDetails.type === 'Grátis/Doação' ? 'bg-emerald-600/95 text-white' : 'bg-blue-600/95 text-white'}`}>
                    {selectedMarketDetails.type === 'Troca' || selectedMarketDetails.type === 'Trocas' ? '🔄 TROCA' : selectedMarketDetails.type}
                  </span>
                </div>
              </div>
            )}
            <div className="p-6" style={{ padding: '24px' }}>
              <div className="flex gap-2 mb-2" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md" style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', color: '#ea580c', backgroundColor: '#fff7ed' }}>
                  {selectedMarketDetails.category || 'Geral'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>{selectedMarketDetails.title}</h1>
              
              <div className="mb-4">
                {selectedMarketDetails.type === 'Troca' || selectedMarketDetails.type === 'Trocas' ? (
                  <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 rounded-2xl font-black text-base shadow-sm">
                    <span className="text-lg">🔄</span>
                    <span>Disponível para Troca</span>
                  </div>
                ) : selectedMarketDetails.type === 'Grátis' || selectedMarketDetails.type === 'Grátis/Doação' ? (
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-2xl font-black text-base shadow-sm">
                    <span className="text-lg">🎁</span>
                    <span>Doação / Grátis</span>
                  </div>
                ) : (
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600" style={{ fontSize: '1.75rem', fontWeight: '900', color: '#16a34a', marginBottom: '16px' }}>
                    {Number(selectedMarketDetails.price) > 0 ? `R$ ${Number(selectedMarketDetails.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Sob Consulta'}
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl mb-6" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <p className="text-slate-700 whitespace-pre-wrap" style={{ color: '#334155' }}>{selectedMarketDetails.description}</p>
              </div>

              <div className="text-sm text-slate-500 mb-6" style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '24px' }}>
                <p><strong>📍 Local:</strong> {selectedMarketDetails.neighborhood}</p>
                <p><strong>👤 Anunciante:</strong> {selectedMarketDetails.seller_name}</p>
              </div>

              {selectedMarketDetails.seller_whatsapp && (
                <a href={"https://wa.me/" + String(selectedMarketDetails.seller_whatsapp).replace(/\D/g, '')} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-green-500 text-white w-full py-3 rounded-xl font-bold hover:bg-green-600 transition-colors" style={{ display: 'block', backgroundColor: '#22c55e', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
                  Negociar no WhatsApp
                </a>
              )}
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
                  const userStr = localStorage.getItem('user') || localStorage.getItem('impersonatedUser');
                  const userAuth = localStorage.getItem('user_auth');
                  if (!userStr && userAuth !== 'true') {
                    alert('🔒 Para anunciar no Marketplace do Fala do Bairro é obrigatório estar cadastrado e conectado! Por favor, faça login ou crie sua conta.');
                    navigate('/register');
                    return;
                  }
                  navigate('/marketplace/anunciar');
                }}
                className="w-full text-left flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛍️</div>
                <div>
                  <h4 className="font-bold text-slate-800">Venda / Marketplace</h4>
                  <p className="text-xs text-slate-500">Anuncie produtos e serviços no bairro</p>
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
