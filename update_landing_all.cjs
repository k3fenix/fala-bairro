const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

// 1. Add states
const newStates = `
  const [selectedPetDetails, setSelectedPetDetails] = useState<any>(null);
  const [selectedBusinessDetails, setSelectedBusinessDetails] = useState<any>(null);
  const [selectedPostDetails, setSelectedPostDetails] = useState<any>(null);
  const [selectedNewsDetails, setSelectedNewsDetails] = useState<any>(null);
  const [selectedMarketDetails, setSelectedMarketDetails] = useState<any>(null);
`;
content = content.replace(/const \[marketplaceItems, setMarketplaceItems\] = useState<any\[\]>\(\[\]\);/, newStates + '\n  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);');

// 2. Posts (publicPosts)
content = content.replace(
  /<div key=\{post\.id\} className="post-card">/g,
  '<div key={post.id} onClick={() => setSelectedPostDetails(post)} className="post-card" style={{ cursor: "pointer" }}>'
);
content = content.replace(
  /onClick=\{\(\) => handleVote\(post\.id, 'likes'\)\}/g,
  'onClick={(e) => { e.stopPropagation(); handleVote(post.id, \'likes\'); }}'
);
content = content.replace(
  /onClick=\{\(\) => shareText/g,
  'onClick={(e) => { e.stopPropagation(); shareText'
);
content = content.replace(
  /<Link to="\/feed" className="btn-action-ghost"/g,
  '<Link to="/feed" onClick={(e) => e.stopPropagation()} className="btn-action-ghost"'
);
// Fix the missing closing brackets on the share buttons we just replaced
content = content.replace(
  /shareText\('Obras de recapeamento na Avenida Central'\)\}/g,
  'shareText(\'Obras de recapeamento na Avenida Central\'); }}'
);
content = content.replace(
  /shareText\('Mutirão de vacinação no Posto de Saúde'\)\}/g,
  'shareText(\'Mutirão de vacinação no Posto de Saúde\'); }}'
);
content = content.replace(
  /shareText\('Feira de produtores na Praça da Paz'\)\}/g,
  'shareText(\'Feira de produtores na Praça da Paz\'); }}'
);
content = content.replace(
  /shareText\(`Publicação de \$\{post\.author_name\} no Mural`\)\}/g,
  'shareText(`Publicação de ${post.author_name} no Mural`); }}'
);

// 3. Pets (allPets)
content = content.replace(
  /<div key=\{pet\.id\} className="animal-card">/g,
  '<div key={pet.id} onClick={() => setSelectedPetDetails(pet)} className="animal-card" style={{ cursor: "pointer" }}>'
);
content = content.replace(
  /onClick=\{\(\) => openWhatsApp\(pet\.owner_whatsapp/g,
  'onClick={(e) => { e.stopPropagation(); openWhatsApp(pet.owner_whatsapp'
);
// fix brackets for pets
content = content.replace(
  /openWhatsApp\(pet\.owner_whatsapp, `Olá, vi o anúncio sobre o \$\{pet\.pet_name\} no Fala do Bairro!`\)\}/g,
  'openWhatsApp(pet.owner_whatsapp, `Olá, vi o anúncio sobre o ${pet.pet_name} no Fala do Bairro!`); }}'
);

// 4. Commercial Guide (commercialGuide)
content = content.replace(
  /<div key=\{business\.id\} className="business-card">/g,
  '<div key={business.id} onClick={() => setSelectedBusinessDetails(business)} className="business-card" style={{ cursor: "pointer" }}>'
);
content = content.replace(
  /onClick=\{\(\) => openWhatsApp\(business\.whatsapp/g,
  'onClick={(e) => { e.stopPropagation(); openWhatsApp(business.whatsapp'
);
// fix brackets for business
content = content.replace(
  /openWhatsApp\(business\.whatsapp, `Olá \$\{business\.name\}, vi o anúncio no Fala do Bairro!`\)\}>📱 WhatsApp<\/button>/g,
  'openWhatsApp(business.whatsapp, `Olá ${business.name}, vi o anúncio no Fala do Bairro!`); }}>📱 WhatsApp</button>'
);

// 5. News Cards (static)
let newsCount = 0;
content = content.replace(
  /<article className="news-card">/g,
  (match) => {
    newsCount++;
    if (newsCount === 1) {
      return '<article className="news-card" style={{ cursor: "pointer" }} onClick={() => setSelectedNewsDetails({ title: "Obras de recapeamento na Avenida Central começam nesta segunda-feira", summary: "Trânsito terá desvio temporário pela Rua das Flores durante toda a semana. Moradores devem ficar atentos às linhas de ônibus.", category: "Infraestrutura", neighborhood: "Mário Covas", image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80", date: "Hoje às 09:30" })}>';
    } else if (newsCount === 2) {
      return '<article className="news-card" style={{ cursor: "pointer" }} onClick={() => setSelectedNewsDetails({ title: "Posto de Saúde do bairro terá mutirão de vacinação no próximo sábado", summary: "Atendimento das 8h às 17h para atualização da caderneta de crianças, jovens e idosos. Leve documento com foto.", category: "Saúde", neighborhood: "Mário Covas", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80", date: "Ontem" })}>';
    } else if (newsCount === 3) {
      return '<article className="news-card" style={{ cursor: "pointer" }} onClick={() => setSelectedNewsDetails({ title: "Feira de produtores e artesanato local atrai mais de 400 famílias na praça", summary: "Evento valoriza feirantes do bairro e movimenta a economia local com opções gastronômicas e música ao vivo.", category: "Cultura", neighborhood: "Praça da Paz", image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80", date: "Há 2 dias" })}>';
    }
    return match;
  }
);

// 6. Marketplace Items
content = content.replace(
  /<div key=\{item\.id\} className="market-card">/g,
  '<div key={item.id} onClick={() => setSelectedMarketDetails(item)} className="market-card" style={{ cursor: "pointer" }}>'
);
content = content.replace(
  /onClick=\{\(\) => openWhatsApp\(item\.seller_whatsapp/g,
  'onClick={(e) => { e.stopPropagation(); openWhatsApp(item.seller_whatsapp'
);
content = content.replace(
  /style=\{\{ background: 'none', border: 'none', color: 'var\(--primary\)', cursor: 'pointer', fontWeight: 'bold' \}\}>Contatar/g,
  'style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "bold" }}>Contatar'
);
// fix brackets for marketplace
content = content.replace(
  /openWhatsApp\(item\.seller_whatsapp, `Olá, vi o anúncio: \$\{item\.title\} no Fala do Bairro!`\)\}/g,
  'openWhatsApp(item.seller_whatsapp, `Olá, vi o anúncio: ${item.title} no Fala do Bairro!`); }}'
);

// 7. Insert ALL Modals before </footer>
const allModals = `
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
                <a href={"https://wa.me/" + String(selectedPetDetails.owner_whatsapp).replace(/\\D/g, '')} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 bg-green-500 text-white w-full py-3 rounded-xl font-bold hover:bg-green-600 transition-colors" style={{ display: 'block', marginTop: '24px', backgroundColor: '#22c55e', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
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
                <a href={"https://wa.me/" + String(selectedBusinessDetails.whatsapp).replace(/\\D/g, '')} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 bg-green-500 text-white w-full py-3 rounded-xl font-bold hover:bg-green-600 transition-colors" style={{ display: 'block', marginTop: '24px', backgroundColor: '#22c55e', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
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
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: 'white' }}>
              <h2 className="font-bold text-lg">Detalhes da Publicação</h2>
              <button onClick={() => setSelectedPostDetails(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200" style={{ padding: '8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                X
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
              <p className="text-slate-800 whitespace-pre-wrap text-lg mb-4" style={{ fontSize: '1.125rem', marginBottom: '16px' }}>{selectedPostDetails.content}</p>
              {selectedPostDetails.image && (
                <img src={selectedPostDetails.image} alt="Post" className="w-full rounded-2xl mb-4" style={{ width: '100%', borderRadius: '16px' }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* News Details Modal */}
      {selectedNewsDetails && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedNewsDetails(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: 'white' }}>
              <h2 className="font-bold text-lg" style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>Notícia Local</h2>
              <button onClick={() => setSelectedNewsDetails(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200" style={{ padding: '8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                X
              </button>
            </div>
            {selectedNewsDetails.image && (
              <img src={selectedNewsDetails.image} alt="News" className="w-full h-64 object-cover" style={{ width: '100%', height: '16rem', objectFit: 'cover' }} />
            )}
            <div className="p-6" style={{ padding: '24px' }}>
              <div className="flex gap-2 mb-3" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '4px 8px', borderRadius: '6px' }}>{selectedNewsDetails.category}</span>
                <span className="text-xs text-slate-500 flex items-center" style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedNewsDetails.neighborhood}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-4" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>{selectedNewsDetails.title}</h1>
              <p className="text-slate-700 text-lg leading-relaxed mb-6" style={{ fontSize: '1.125rem', color: '#334155', lineHeight: 1.625, marginBottom: '24px' }}>{selectedNewsDetails.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Details Modal */}
      {selectedMarketDetails && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedMarketDetails(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '28rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: 'white' }}>
              <h2 className="font-bold text-lg" style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>Detalhes do Anúncio</h2>
              <button onClick={() => setSelectedMarketDetails(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200" style={{ padding: '8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                X
              </button>
            </div>
            {selectedMarketDetails.image && (
              <div className="w-full bg-slate-100" style={{ width: '100%', backgroundColor: '#f1f5f9' }}>
                <img src={selectedMarketDetails.image} alt="Produto" className="w-full object-contain max-h-64" style={{ width: '100%', objectFit: 'contain', maxHeight: '16rem' }} />
              </div>
            )}
            <div className="p-6" style={{ padding: '24px' }}>
              <div className="flex gap-2 mb-2" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', backgroundColor: selectedMarketDetails.type === 'Venda' ? '#eff6ff' : selectedMarketDetails.type === 'Troca' ? '#fdf4ff' : '#f0fdf4', color: selectedMarketDetails.type === 'Venda' ? '#2563eb' : selectedMarketDetails.type === 'Troca' ? '#c026d3' : '#16a34a' }}>
                  {selectedMarketDetails.type}
                </span>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md" style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', color: '#ea580c', backgroundColor: '#fff7ed' }}>
                  {selectedMarketDetails.category}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>{selectedMarketDetails.title}</h1>
              <div className="text-3xl font-black text-green-600 mb-4" style={{ fontSize: '1.875rem', fontWeight: '900', color: '#16a34a', marginBottom: '16px' }}>
                {selectedMarketDetails.type === 'Venda' ? \`R$ \${selectedMarketDetails.price}\` : selectedMarketDetails.type}
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl mb-6" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <p className="text-slate-700 whitespace-pre-wrap" style={{ color: '#334155' }}>{selectedMarketDetails.description}</p>
              </div>

              <div className="text-sm text-slate-500 mb-6" style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '24px' }}>
                <p><strong>📍 Local:</strong> {selectedMarketDetails.neighborhood}</p>
                <p><strong>👤 Anunciante:</strong> {selectedMarketDetails.seller_name}</p>
              </div>

              {selectedMarketDetails.seller_whatsapp && (
                <a href={"https://wa.me/" + String(selectedMarketDetails.seller_whatsapp).replace(/\\D/g, '')} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-green-500 text-white w-full py-3 rounded-xl font-bold hover:bg-green-600 transition-colors" style={{ display: 'block', backgroundColor: '#22c55e', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
                  Negociar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  /    <\/div>\s*\);\s*\}/g,
  allModals + '\n    </div>\n  );\n}'
);

fs.writeFileSync('src/pages/Landing.tsx', content);
console.log('Done applying all modals to Landing.tsx');
