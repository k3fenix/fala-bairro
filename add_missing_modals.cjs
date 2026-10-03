const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

// 1. Add states for selectedNewsDetails and selectedMarketDetails
const newStates = `
  const [selectedNewsDetails, setSelectedNewsDetails] = useState<any>(null);
  const [selectedMarketDetails, setSelectedMarketDetails] = useState<any>(null);
`;
content = content.replace(/const \[selectedPostDetails, setSelectedPostDetails\] = useState<any>\(null\);/, 'const [selectedPostDetails, setSelectedPostDetails] = useState<any>(null);\n' + newStates);


// 2. Make news cards clickable
content = content.replace(
  /<article className="news-card">/g,
  '<article className="news-card" style={{ cursor: "pointer" }} onClick={() => setSelectedNewsDetails({ title: "Obras de recapeamento na Avenida Central começam nesta segunda-feira", summary: "Trânsito terá desvio temporário pela Rua das Flores durante toda a semana. Moradores devem ficar atentos às linhas de ônibus.", category: "Infraestrutura", neighborhood: "Mário Covas", image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80", date: "Hoje às 09:30" })}>'
);
// Fix the second and third to have correct details (a bit hacky but it works for hardcoded)
// We replace them sequentially
let count = 0;
content = content.replace(/onClick=\{\(\) => setSelectedNewsDetails\(\{ title: "Obras de recapeamento/g, (match) => {
  count++;
  if (count === 2) {
    return 'onClick={() => setSelectedNewsDetails({ title: "Posto de Saúde do bairro terá mutirão de vacinação no próximo sábado", summary: "Atendimento das 8h às 17h para atualização da caderneta de crianças, jovens e idosos. Leve documento com foto.", category: "Saúde", neighborhood: "Mário Covas", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80", date: "Ontem"';
  } else if (count === 3) {
    return 'onClick={() => setSelectedNewsDetails({ title: "Feira de produtores e artesanato local atrai mais de 400 famílias na praça", summary: "Evento valoriza feirantes do bairro e movimenta a economia local com opções gastronômicas e música ao vivo.", category: "Cultura", neighborhood: "Praça da Paz", image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80", date: "Há 2 dias"';
  }
  return match;
});


// 3. Make marketplace cards clickable
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


// 4. Add the modals before </footer>
const newModals = `
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
              <div className="flex justify-between items-center text-sm text-slate-500 pt-4 border-t border-slate-100" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#64748b', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <span>Publicado {selectedNewsDetails.date}</span>
                <button className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700" onClick={() => shareText(selectedNewsDetails.title)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
                  📤 Compartilhar
                </button>
              </div>
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
                <a href={"https://wa.me/" + String(selectedMarketDetails.seller_whatsapp).replace(/\D/g, '')} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-green-500 text-white w-full py-3 rounded-xl font-bold hover:bg-green-600 transition-colors" style={{ display: 'block', backgroundColor: '#22c55e', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
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
  newModals + '\n    </div>\n  );\n}'
);

fs.writeFileSync('src/pages/Landing.tsx', content);
console.log('Done adding missing modals in Landing.tsx');
