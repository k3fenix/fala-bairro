import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { ArrowLeft, UploadCloud, X, CheckCircle, Repeat, Star } from 'lucide-react';
import { getAuthUser, type UserSession } from '../lib/authHelper';
import { compressImage } from '../lib/imageUtils';
import { useAuth } from '../context/AuthContext';

export default function MarketplaceNew() {
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(contextUser);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    ad_type: 'Venda', // 'Venda', 'Troca', 'Gratis'
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
    const initAuth = async () => {
      const user = contextUser || (await getAuthUser());
      if (!user) {
        alert('🔒 Atenção: É necessário estar conectado na sua conta para anunciar produtos no Marketplace!');
        navigate('/login');
        return;
      }
      setCurrentUser(user);
      setFormData(prev => ({
        ...prev,
        neighborhood: user.neighborhood || prev.neighborhood || 'Mário Covas',
        whatsapp: user.whatsapp || prev.whatsapp || ''
      }));
      fetchCategories();
    };
    initAuth();
  }, [navigate, contextUser]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('marketplace_categories').select('*').eq('is_active', true).order('order_index');
    if (data) setCategories(data);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fileToBase64 = async (file: File): Promise<string> => {
    try {
      return await compressImage(file, 900, 900, 0.82);
    } catch (_) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    }
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
      const user = currentUser || (await getAuthUser());
      const userId = user?.id || null;

      const isGratis = formData.ad_type === 'Gratis';
      const isTroca = formData.ad_type === 'Troca' || formData.accepts_trade === 'sim';

      const priceNum = parseFloat(String(formData.price).replace(',', '.'));
      const finalPrice = isGratis ? 0 : (isNaN(priceNum) ? 0 : priceNum);
      const acceptsTradeBool = isTroca;

      const effectiveType = isGratis ? 'Grátis' : (formData.ad_type === 'Troca' ? 'Troca' : 'Venda');

      // Seleciona a imagem principal
      const primaryImage = imagePreviews[primaryIndex] || imagePreviews[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

      const selectedCategoryObj = categories.find(c => c.id.toString() === formData.category_id);
      const categoryName = selectedCategoryObj?.name || 'Outros';

      let itemsSaved = false;
      let listingsSaved = false;

      // 1. Inserir com total segurança em marketplace_items (tabela universal)
      const baseItemPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: finalPrice,
        type: effectiveType,
        condition: formData.condition,
        neighborhood: formData.neighborhood.trim(),
        seller_name: user?.name || 'Vendedor do Bairro',
        seller_whatsapp: formData.whatsapp.trim(),
        image: primaryImage,
        status: 'Ativo'
      };

      try {
        const { error: catErr } = await supabase.from('marketplace_items').insert({
          ...baseItemPayload,
          category: categoryName
        });
        if (!catErr) {
          itemsSaved = true;
        } else {
          console.warn("Tentando sem coluna category em marketplace_items:", catErr.message);
          const { error: fallbackErr } = await supabase.from('marketplace_items').insert(baseItemPayload);
          if (!fallbackErr) itemsSaved = true;
        }
      } catch (errItems) {
        console.warn("Erro ao salvar em marketplace_items:", errItems);
      }

      // 2. Inserir também em marketplace_listings (schema v2)
      try {
        const listingPayload: any = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: finalPrice,
          condition: formData.condition,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          state: formData.state || 'SP',
          city: formData.city || 'Campinas',
          neighborhood: formData.neighborhood.trim(),
          whatsapp: formData.whatsapp.trim(),
          status: 'approved'
        };
        if (userId) {
          listingPayload.user_id = userId;
        }

        const { data: newListing, error: listingError } = await supabase.from('marketplace_listings').insert(listingPayload).select().single();
        if (!listingError && newListing?.id) {
          listingsSaved = true;
          if (imagePreviews.length > 0) {
            const imagesPayload = imagePreviews.map((imgUrl, idx) => ({
              listing_id: newListing.id,
              image_url: imgUrl,
              is_primary: idx === primaryIndex,
              order_index: idx
            }));
            await supabase.from('marketplace_listing_images').insert(imagesPayload);
          }
        } else if (listingError) {
          console.warn("Aviso ao salvar em marketplace_listings com user_id:", listingError.message);
          // Tentar novamente sem user_id caso seja restrição de foreign key
          delete listingPayload.user_id;
          const { data: retryListing, error: retryErr } = await supabase.from('marketplace_listings').insert(listingPayload).select().single();
          if (!retryErr && retryListing?.id) {
            listingsSaved = true;
            if (imagePreviews.length > 0) {
              const imagesPayload = imagePreviews.map((imgUrl, idx) => ({
                listing_id: retryListing.id,
                image_url: imgUrl,
                is_primary: idx === primaryIndex,
                order_index: idx
              }));
              await supabase.from('marketplace_listing_images').insert(imagesPayload);
            }
          }
        }
      } catch (errListings) {
        console.warn("Erro ao salvar em marketplace_listings:", errListings);
      }

      if (!itemsSaved && !listingsSaved) {
        throw new Error('Falha na comunicação com o banco de dados. Verifique sua conexão e tente novamente.');
      }

      setSuccess(true);
      setTimeout(() => navigate(`/marketplace?refresh=${Date.now()}`), 1200);

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
          {currentUser ? (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-xs font-bold text-orange-900 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="truncate max-w-[120px]">{currentUser.name}</span>
            </div>
          ) : (
            <div className="w-16"></div>
          )}
        </div>
      </header>

      <main className="max-w-[800px] mx-auto p-4 sm:p-6 mt-2">
        {currentUser && (
          <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                ✓
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-sm">
                  Publicando como: <span className="text-emerald-700">{currentUser.name}</span>
                </p>
                <p className="text-xs text-slate-500">
                  📍 {currentUser.neighborhood || 'Bairro'} • Anúncio publicado diretamente pela sua conta
                </p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
              Conta Conectada
            </span>
          </div>
        )}
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

            {/* MODALIDADE DO ANÚNCIO: VENDA / TROCA / DOAÇÃO */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-sm font-bold text-slate-800">
                O que você deseja fazer com este item? *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, ad_type: 'Venda' }))}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${formData.ad_type === 'Venda' ? 'bg-[#ff6500] text-white border-[#ff6500] shadow-md shadow-orange-500/20' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                >
                  <span className="text-lg">🏷️</span>
                  <span>Vender</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, ad_type: 'Troca', accepts_trade: 'sim' }))}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${formData.ad_type === 'Troca' ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                >
                  <span className="text-lg">🔄</span>
                  <span>Trocar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, ad_type: 'Gratis', price: '0' }))}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${formData.ad_type === 'Gratis' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                >
                  <span className="text-lg">🎁</span>
                  <span>Doar (Grátis)</span>
                </button>
              </div>
            </div>

            {/* OPÇÃO DE TROCA SE FOR VENDA */}
            {formData.ad_type === 'Venda' && (
              <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl">
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-[#ff6500]" />
                  Além da venda, você também aceita proposta de troca?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-sm">
                    <input 
                      type="radio" 
                      name="accepts_trade" 
                      value="sim" 
                      checked={formData.accepts_trade === 'sim'} 
                      onChange={handleChange} 
                      className="w-4 h-4 accent-[#ff6500]" 
                    />
                    <span>Sim, aceito analisar trocas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-sm">
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
            )}

            {/* PREÇO OU AVISO DE GRATUIDADE / TROCA */}
            {formData.ad_type === 'Gratis' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-3">
                <span className="text-2xl">🎁</span>
                <div>
                  <strong className="block text-sm font-bold">Anúncio Gratuito / Doação</strong>
                  <span className="text-xs text-emerald-700">Este item será exibido sem custo na aba "Grátis / Doação" para quem precisar no bairro.</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {formData.ad_type === 'Troca' ? 'Valor Estimado para Troca (R$) - Opcional' : 'Preço de Venda (R$) *'}
                </label>
                <input 
                  required={formData.ad_type === 'Venda'} 
                  type="number" 
                  step="0.01" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleChange} 
                  placeholder="0.00" 
                  className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white text-xl font-bold text-slate-900 transition-colors" 
                />
              </div>
            )}

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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cidade *</label>
                <select 
                  required 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#ff6500] focus:bg-white font-semibold cursor-pointer"
                >
                  <option value="Campinas">Campinas - SP</option>
                  <option value="Santa Bárbara d'Oeste">Santa Bárbara d'Oeste - SP</option>
                  <option value="Americana">Americana - SP</option>
                  <option value="Sumaré">Sumaré - SP</option>
                  <option value="Nova Odessa">Nova Odessa - SP</option>
                  <option value="Hortolândia">Hortolândia - SP</option>
                  <option value="Piracicaba">Piracicaba - SP</option>
                  <option value="Limeira">Limeira - SP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bairro / Região *</label>
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
                  placeholder="(19) 99999-9999" 
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
