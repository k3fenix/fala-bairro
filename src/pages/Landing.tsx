import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Landing.css';

export default function Landing() {
  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [commercialGuide, setCommercialGuide] = useState<any[]>([]);
  const [lostPets, setLostPets] = useState<any[]>([]);
  const [adoptionPets, setAdoptionPets] = useState<any[]>([]);
  const [allPets, setAllPets] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [sessionVotes, setSessionVotes] = useState<Record<string, boolean>>({});
  const [monetizationEnabled, setMonetizationEnabled] = useState(false);

  useEffect(() => {
    fetchPublicPosts();
    fetchCommercialGuide();
    fetchLostPets();
    fetchMarketplaceItems();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('key', 'monetization_enabled');
    if (data && data.length > 0) {
      setMonetizationEnabled(data[0].value === 'true');
    }
  };

  const fetchLostPets = async () => {
    const { data } = await supabase.from('lost_pets').select('*').order('created_at', { ascending: false });
    if (data) {
      setAllPets(data);
      setLostPets(data.filter(p => p.status === 'Perdido'));
      setAdoptionPets(data.filter(p => p.status === 'Adoção'));
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
            <Link to="/feed" className="btn-publish-main">
              + <span className="hidden sm:inline">Publicar</span>
            </Link>
            <Link to="/login" className="btn-header-profile">
              👤 <span className="hidden sm:inline">Conta</span>
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
          <a href="#vendas" className="chip">🛒 Vendas & Trocas</a>
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
            <article className="news-card">
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
                  <button className="share-btn-inline" onClick={() => shareText('Obras de recapeamento na Avenida Central')}>📤 Compartilhar</button>
                </div>
              </div>
            </article>

            <article className="news-card">
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
                  <button className="share-btn-inline" onClick={() => shareText('Mutirão de vacinação no Posto de Saúde')}>📤 Compartilhar</button>
                </div>
              </div>
            </article>

            <article className="news-card">
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
                  <button className="share-btn-inline" onClick={() => shareText('Feira de produtores na Praça da Paz')}>📤 Compartilhar</button>
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
              <div key={post.id} className="post-card">
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
                    <button className="btn-action-ghost" onClick={() => handleVote(post.id, 'likes')}>👍 <span>{post.likes || 0} curtidas</span></button>
                    <Link to="/feed" className="btn-action-ghost">💬 {post.comments?.length || 0} comentários</Link>
                  </div>
                  <div className="post-action-group">
                    <button className="btn-action-ghost" onClick={() => shareText(`Publicação de ${post.author_name} no Mural`)}>📤 Compartilhar</button>
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
              <div key={pet.id} className="animal-card">
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
                  <button className="btn-contact-whatsapp" onClick={() => openWhatsApp(pet.owner_whatsapp, `Olá, vi o anúncio sobre o ${pet.pet_name} no Fala do Bairro!`)}>
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
              <div key={business.id} className="business-card">
                {business.image ? (
                  <img className="business-thumb" src={business.image} alt={business.name} loading="lazy" />
                ) : (
                  <div className="business-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏪</div>
                )}
                <div className="business-details">
                  <span className="business-category">{business.category}</span>
                  <h4>{business.name}</h4>
                  <p className="business-address" style={{ fontSize: '11px' }}>{business.description?.substring(0, 40)}...</p>
                  <button className="btn-business-cta" onClick={() => openWhatsApp(business.whatsapp, `Olá ${business.name}, vi o anúncio no Fala do Bairro!`)}>📱 WhatsApp</button>
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
            <h2 className="section-title">🛒 Vendas & Trocas da Comunidade</h2>
            <Link to="/feed" className="section-link">+ Anunciar item ➔</Link>
          </div>

          <div className="market-filter-bar">
            <button className="market-filter-btn active">TODOS</button>
            <button className="market-filter-btn">🏷️ VENDAS</button>
            <button className="market-filter-btn">🔄 TROCAS</button>
            <button className="market-filter-btn">🎁 GRÁTIS / DOAÇÃO</button>
          </div>

          <div className="market-grid">
            {marketplaceItems.map(item => (
              <div key={item.id} className="market-card">
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
                  <div className="market-price">{item.type === 'Venda' ? `R$ ${item.price}` : item.type}</div>
                  <div className="market-title">{item.title}</div>
                  <div className="market-meta">
                    <span>{item.neighborhood}</span>
                    <button onClick={() => openWhatsApp(item.seller_whatsapp, `Olá, vi o anúncio: ${item.title} no Fala do Bairro!`)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Contatar</button>
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

        {/* Indicador de Arquitetura de Monetização */}
        <div className="monetization-blueprint-note" id="monetizationStatusBox">
          <div>
            <strong>⚙️ Configuração de Plataforma Comunitária:</strong>
            <span>{monetizationEnabled ? 'Módulos premium e taxas estão ativados.' : 'Taxas e cobranças desativadas. Todos os anúncios e publicações permanecem 100% gratuitos.'}</span>
          </div>
          <span className={`monetization-badge-status ${monetizationEnabled ? 'bg-emerald-200 text-emerald-800' : ''}`}>
            MONETIZAÇÃO: {monetizationEnabled ? 'ATIVADA' : 'DESATIVADA'}
          </span>
        </div>

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
    </div>
  );
}
