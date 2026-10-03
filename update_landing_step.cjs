const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

// Replace Publicar Link with Button
const publishRegex = /<Link to="\/feed" className="btn-publish-main">\s*\+\s*<span className="hidden sm:inline">Publicar<\/span>\s*<\/Link>/g;
code = code.replace(publishRegex, `<button onClick={() => setShowPublishModal(true)} className="btn-publish-main">
              + <span className="hidden sm:inline">Publicar</span>
            </button>`);

// Add State
if (!code.includes('showPublishModal')) {
    code = code.replace('const [selectedMarketDetails, setSelectedMarketDetails] = useState<any>(null);', 
    'const [selectedMarketDetails, setSelectedMarketDetails] = useState<any>(null);\n  const [showPublishModal, setShowPublishModal] = useState(false);');
}

// Replace Vendas & Trocas da Comunidade -> Marketplace
const sectionRegex = /<h2 className="section-title">.*?Vendas \& Trocas da Comunidade<\/h2>\s*<Link to="\/feed" className="section-link">\+ Anunciar item .*?<\/Link>/g;
code = code.replace(sectionRegex, `<h2 className="section-title">🛒 Fala do Bairro Marketplace</h2>
            <Link to="/marketplace" className="section-link">Explorar Marketplace ➔</Link>`);

// Insert Modal Code Before Footer
if (!code.includes('MODAL DE PUBLICAÇÃO')) {
    const modalCode = `      {/* ==========================================================================
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

              <Link to="/marketplace/anunciar" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛍️</div>
                <div>
                  <h4 className="font-bold text-slate-800">Venda / Marketplace</h4>
                  <p className="text-xs text-slate-500">Anuncie produtos e serviços</p>
                </div>
              </Link>

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

      <footer className="main-footer">`;
    code = code.replace(/<footer className="main-footer">/, modalCode);
}

fs.writeFileSync('src/pages/Landing.tsx', code);
console.log('Landing.tsx atualizado com sucesso.');
