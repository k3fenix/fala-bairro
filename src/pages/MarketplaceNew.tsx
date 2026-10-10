import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, UploadCloud, X, CheckCircle, Repeat, Star } from 'lucide-react';

export default function MarketplaceNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    price: '',
    condition: 'Usado',
    accepts_trade: 'nao', // 'sim' ou 'nao'
    description: '',
    brand: '',
    model: '',
    state: 'SP',
    city: 'Campinas',
    neighborhood: localStorage.getItem('user_neighborhood') || 'Mário Covas',
    zip_code: '',
    whatsapp: localStorage.getItem('user_whatsapp') || ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user') || localStorage.getItem('impersonatedUser');
    const userAuth = localStorage.getItem('user_auth');
    if (!userStr && userAuth !== 'true') {
      alert('🔒 Atenção: É OBRIGATÓRIO fazer Cadastro / Login no Fala do Bairro para anunciar produtos no Marketplace!');
      navigate('/register');
      return;
    }
    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('marketplace_categories').select('*').eq('is_active', true).order('order_index');
    if (data) setCategories(data);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageChange = async (e: any) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      if (imageFiles.length + files.length > 5) {
        alert('Você pode enviar no máximo 5 fotos.');
        return;
      }

      const newFiles = [...imageFiles, ...files];
      setImageFiles(newFiles);

      try {
        const newBase64s = await Promise.all(files.map(f => fileToBase64(f)));
        setImagePreviews(prev => [...prev, ...newBase64s]);
      } catch (err) {
        console.error("Erro ao carregar preview das fotos", err);
      }
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    if (primaryIndex === index) {
      setPrimaryIndex(0);
    } else if (primaryIndex > index) {
      setPrimaryIndex(primaryIndex - 1);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('impersonatedUser');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userId = currentUser?.id || null;

      const priceNum = parseFloat(String(formData.price).replace(',', '.'));
      const finalPrice = isNaN(priceNum) ? 0 : priceNum;
      const acceptsTradeBool = formData.accepts_trade === 'sim';

      // Seleciona a imagem principal
      const primaryImage = imagePreviews[primaryIndex] || imagePreviews[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

      // 1. Inserir em marketplace_listings
      const { data: newListing, error: listingError } = await supabase.from('marketplace_listings').insert({
        user_id: userId,
        title: formData.title,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        price: finalPrice,
        condition: formData.condition,
        accepts_trade: acceptsTradeBool,
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
        state: formData.state,
        city: formData.city,
        neighborhood: formData.neighborhood,
        zip_code: formData.zip_code,
        whatsapp: formData.whatsapp,
        image_url: primaryImage,
        image: primaryImage,
        status: 'approved' // Auto aprovação ativada
      }).select().single();

      if (listingError) {
        console.warn("Aviso ao salvar em marketplace_listings:", listingError.message);
      }

      const listingId = newListing?.id || null;

      // 2. Salvar galeria em marketplace_listing_images se listingId existir
      if (listingId && imagePreviews.length > 0) {
        const imagesPayload = imagePreviews.map((imgUrl, idx) => ({
          listing_id: listingId,
          image_url: imgUrl,
          is_primary: idx === primaryIndex,
          order_index: idx
        }));

        await supabase.from('marketplace_listing_images').insert(imagesPayload);
      }

      // 3. Fallback de compatibilidade retroativa em marketplace_items
      await supabase.from('marketplace_items').insert({
        title: formData.title,
        description: formData.description,
        price: finalPrice,
        type: acceptsTradeBool ? 'Troca' : 'Venda',
        condition: formData.condition,
        category: categories.find(c => c.id.toString() === formData.category_id)?.name || 'Outros',
        neighborhood: formData.neighborhood,
        seller_name: currentUser?.name || 'Vendedor do Bairro',
        seller_whatsapp: formData.whatsapp,
        image: primaryImage,
        status: 'Ativo'
      }).select();

      setSuccess(true);
      setTimeout(() => navigate('/marketplace'), 2000);

    } catch (err: any) {
      alert('Erro ao publicar anúncio: ' + (err.message || 'Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">Anúncio Publicado com Sucesso!</h1>
        <p className="text-slate-600 max-w-sm mb-6 leading-relaxed">
          Seu produto já está visível para os moradores no Marketplace do Fala do Bairro.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1d2433] pb-16">
      <header className="bg-white border-b border-[#e7e7e7] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[800px] mx-auto min-h-[64px] flex items-center justify-between px-4">
          <button 
            type="button" 
            onClick={() => navigate('/marketplace')} 
            className="flex items-center gap-2 text-slate-600 font-bold hover:text-[#ff6500] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">Anunciar Produto</div>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto p-4 sm:p-6 mt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* FOTOS DO PRODUTO */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Fotos do Produto</h2>
                <p className="text-xs text-slate-500">Envie até 5 fotos reais do seu item.</p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {imagePreviews.length}/5 fotos
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden border-2 border-slate-200 group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  
                  {/* Badge de Foto Capa */}
                  {primaryIndex === idx ? (
                    <span className="absolute bottom-1 left-1 bg-[#ff6500] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow">
                      Capa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPrimaryIndex(idx)}
                      className="absolute bottom-1 left-1 bg-black/60 hover:bg-[#ff6500] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Tornar Capa
                    </button>
                  )}

                  {/* Botão Remover */}
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)} 
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    title="Remover foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {imagePreviews.length < 5 && (
                <label className="w-28 h-28 shrink-0 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-orange-50/50 hover:border-[#ff6500] hover:text-[#ff6500] transition-all">
                  <UploadCloud className="w-7 h-7 mb-1" />
                  <span className="text-xs font-bold">Adicionar</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </section>

          {/* INFORMAÇÕES DO PRODUTO */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Informações Principais</h2>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Título do Anúncio *</label>
              <input 
                required 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="Ex: Celular Samsung Galaxy S21 Ultra 256GB" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white transition-colors" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Categoria *</label>
                <select 
                  required 
                  name="category_id" 
                  value={formData.category_id} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white transition-colors"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Condição do Item *</label>
                <select 
                  name="condition" 
                  value={formData.condition} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white transition-colors font-medium"
                >
                  <option value="Novo">✨ Novo</option>
                  <option value="Usado">👌 Usado em bom estado</option>
                  <option value="Seminovo">🌟 Seminovo (pouco uso)</option>
                  <option value="Recondicionado">🛠️ Recondicionado / Revisado</option>
                </select>
              </div>
            </div>

            {/* ACEITA TROCAS (OPÇÃO INDEPENDENTE DA CONDIÇÃO) */}
            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl">
              <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#ff6500]" />
                Aceita Troca por Outros Produtos? *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input 
                    type="radio" 
                    name="accepts_trade" 
                    value="sim" 
                    checked={formData.accepts_trade === 'sim'} 
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#ff6500]" 
                  />
                  <span>Sim, aceito trocas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input 
                    type="radio" 
                    name="accepts_trade" 
                    value="nao" 
                    checked={formData.accepts_trade === 'nao'} 
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#ff6500]" 
                  />
                  <span>Não, somente venda</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Preço de Venda (R$) *</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                placeholder="0.00" 
                className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white text-xl font-bold text-slate-900 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Descrição do Anúncio *</label>
              <textarea 
                required 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Descreva detalhes como estado de conservação, motivo da venda, tempo de uso, etc." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white min-h-[120px] transition-colors leading-relaxed" 
              />
            </div>
          </section>

          {/* LOCALIZAÇÃO E CONTATO */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Localização e Contato</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bairro *</label>
                <input 
                  required 
                  name="neighborhood" 
                  value={formData.neighborhood} 
                  onChange={handleChange} 
                  placeholder="Ex: Mário Covas" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp para Contato *</label>
                <input 
                  required 
                  name="whatsapp" 
                  value={formData.whatsapp} 
                  onChange={handleChange} 
                  placeholder="(67) 99999-9999" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white font-bold" 
                />
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#ff6500] hover:bg-[#e95600] text-white font-extrabold text-lg py-4 rounded-2xl transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Publicando Anúncio...' : '🚀 Publicar Anúncio no Marketplace'}
          </button>
        </form>
      </main>
    </div>
  );
}
