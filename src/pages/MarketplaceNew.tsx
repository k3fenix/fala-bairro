import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, UploadCloud, X, CheckCircle } from 'lucide-react';

export default function MarketplaceNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  
  // Imagens simuladas (Apenas frontend por enquanto, no futuro integrará Storage)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    price: '',
    condition: 'Usado',
    description: '',
    brand: '',
    model: '',
    state: '',
    city: '',
    neighborhood: '',
    zip_code: '',
    whatsapp: ''
  });

  useEffect(() => {
    // Verificar auth - temporário para debug
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Você precisa estar logado para anunciar.');
      navigate('/login');
      return;
    }
    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('marketplace_categories').select('*').eq('is_active', true).order('order_index');
    if (data) setCategories(data);
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: any) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      if (imageFiles.length + files.length > 5) {
        alert('Máximo de 5 fotos.');
        return;
      }
      setImageFiles([...imageFiles, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error("Não autenticado");

      // 1. Inserir Anúncio
      const priceNum = parseFloat(formData.price.replace(',', '.'));
      
      const { data: insertedListing, error } = await supabase.from('marketplace_listings').insert({
        user_id: user.id,
        title: formData.title,
        category_id: formData.category_id,
        price: isNaN(priceNum) ? 0 : priceNum,
        condition: formData.condition,
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
        state: formData.state,
        city: formData.city,
        neighborhood: formData.neighborhood,
        zip_code: formData.zip_code,
        whatsapp: formData.whatsapp,
        status: 'pending' // Por enquanto sempre pending
      }).select().single();

      if (error) throw error;

      // 2. Upload de Imagens (Simulado no DB por agora, precisaria do Storage)
      // Se tivéssemos configurado o bucket marketplace-products:
      // for(let file of imageFiles) { upload... insert into marketplace_listing_images }

      setSuccess(true);
      setTimeout(() => navigate('/marketplace'), 2500);

    } catch (err: any) {
      alert('Erro ao publicar anúncio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <CheckCircle className="w-20 h-20 text-emerald-500 mb-4" />
        <h1 className="text-3xl font-black text-slate-800 mb-2">Anúncio Recebido!</h1>
        <p className="text-slate-600 text-center max-w-sm mb-6">Seu produto foi enviado para análise e em breve estará visível no marketplace.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2433] pb-12">
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-50">
        <div className="max-w-[800px] mx-auto min-h-[72px] flex items-center px-[20px]">
          <button onClick={() => navigate('/marketplace')} className="flex items-center gap-2 text-slate-600 font-bold hover:text-[#ff6500] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="mx-auto font-black text-xl tracking-tight">Novo Anúncio</div>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto p-[20px] mt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* FOTOS */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4">Fotos do Produto</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {imagePreviews.length < 5 && (
                <label className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 hover:border-[#ff6500] hover:text-[#ff6500] transition-all">
                  <UploadCloud className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">Adicionar</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Adicione até 5 fotos. (A funcionalidade final fará upload no bucket marketplace-products)</p>
          </section>

          {/* INFORMAÇÕES BÁSICAS */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold mb-2">Informações Principais</h2>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Título do Anúncio *</label>
              <input required name="title" value={formData.title} onChange={handleChange} placeholder="Ex: iPhone 13 Pro Max 256GB" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Categoria *</label>
                <select required name="category_id" value={formData.category_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] transition-colors">
                  <option value="">Selecione...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Condição *</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] transition-colors">
                  <option value="Novo">Novo</option>
                  <option value="Usado">Usado</option>
                  <option value="Seminovo">Seminovo</option>
                  <option value="Recondicionado">Recondicionado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Preço (R$) *</label>
              <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} placeholder="0,00" className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] text-xl font-bold transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Descrição do Produto *</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} placeholder="Descreva os detalhes, tempo de uso, defeitos, etc." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] min-h-[120px] transition-colors" />
            </div>
          </section>

          {/* LOCALIZAÇÃO */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold mb-2">Localização e Contato</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Estado (UF) *</label>
                <input required name="state" value={formData.state} onChange={handleChange} placeholder="Ex: SP" maxLength={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cidade *</label>
                <input required name="city" value={formData.city} onChange={handleChange} placeholder="Ex: Campinas" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bairro *</label>
                <input required name="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="Ex: Centro" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp *</label>
                <input required name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(11) 99999-9999" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500]" />
              </div>
            </div>
          </section>

          <button type="submit" disabled={loading} className="w-full bg-[#ff6500] hover:bg-[#e95600] text-white font-black text-lg py-4 rounded-2xl transition-colors shadow-[0_10px_20px_rgba(255,101,0,0.3)] disabled:opacity-50">
            {loading ? 'Publicando...' : 'Publicar Anúncio'}
          </button>
        </form>
      </main>
    </div>
  );
}
