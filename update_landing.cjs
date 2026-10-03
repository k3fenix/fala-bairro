const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

// Add states
const stateInsert = `
  const [selectedPetDetails, setSelectedPetDetails] = useState<any>(null);
  const [selectedBusinessDetails, setSelectedBusinessDetails] = useState<any>(null);
  const [selectedPostDetails, setSelectedPostDetails] = useState<any>(null);
`;
content = content.replace(/const \[marketplaceItems, setMarketplaceItems\] = useState<any\[\]>\(\[\]\);/, stateInsert + '\n  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);');

// 1. Posts (publicPosts)
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

// 2. Pets (allPets)
content = content.replace(
  /<div key=\{pet\.id\} className="animal-card">/g,
  '<div key={pet.id} onClick={() => setSelectedPetDetails(pet)} className="animal-card" style={{ cursor: "pointer" }}>'
);
content = content.replace(
  /onClick=\{\(\) => openWhatsApp\(pet\.owner_whatsapp/g,
  'onClick={(e) => { e.stopPropagation(); openWhatsApp(pet.owner_whatsapp'
);

// 3. Commercial Guide (commercialGuide)
content = content.replace(
  /<div key=\{business\.id\} className="business-card">/g,
  '<div key={business.id} onClick={() => setSelectedBusinessDetails(business)} className="business-card" style={{ cursor: "pointer" }}>'
);
content = content.replace(
  /onClick=\{\(\) => openWhatsApp\(business\.whatsapp/g,
  'onClick={(e) => { e.stopPropagation(); openWhatsApp(business.whatsapp'
);

// 4. Modals
const modalsInsert = `
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
`;

content = content.replace(
  /\{showLoginModal && \(/,
  modalsInsert + '\n      {showLoginModal && ('
);

fs.writeFileSync('src/pages/Landing.tsx', content);
console.log('Done modifying Landing.tsx');
