import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabaseMarketplace as supabase } from '../lib/supabaseMarketplace';
import { 
  ArrowLeft, UploadCloud, X, CheckCircle, Repeat, Sparkles, 
  MapPin, Phone, AlertCircle, Info, Trash2, Camera
} from 'lucide-react';
import { getAuthUser, type UserSession } from '../lib/authHelper';
import { compressImage } from '../lib/imageUtils';
import { useAuth } from '../context/AuthContext';

export default function MarketplaceNew() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const isEditing = Boolean(editId);

  const { user: contextUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(contextUser);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [categories, setCategories] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [savedAdId, setSavedAdId] = useState<string | null>(null);
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    ad_type: 'Venda' as 'Venda' | 'Troca' | 'Gratis',
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
    const initAuthAndData = async () => {
      const user = contextUser || (await getAuthUser());
      if (!user) {
        alert('🔒 É necessário estar conectado na sua conta para anunciar ou gerenciar produtos!');
        navigate(`/login?redirect=${encodeURIComponent(isEditing ? `/marketplace/editar/${editId}` : '/marketplace/anunciar')}`);
        return;
      }
      setCurrentUser(user);

      // Carregar categorias
      const { data: catData } = await supabase
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (catData) setCategories(catData);

      // Se for edição, carregar anúncio existente
      if (isEditing && editId) {
        try {
          const { data: ad, error } = await supabase
            .from('marketplace_listings')
            .select('*')
            .eq('id', editId)
            .single();

          if (error || !ad) {
            alert('Anúncio não encontrado para edição.');
            navigate('/marketplace/meus-anuncios');
            return;
          }

          // Verificação de segurança: autorizar apenas o dono do anúncio ou administrador
          const isOwnerUser = (ad.user_id && user.id && String(ad.user_id) === String(user.id)) ||
            (!ad.user_id && user.name && ad.seller_name && user.name.trim().toLowerCase() === ad.seller_name.trim().toLowerCase());
          
          const isAdminUser = localStorage.getItem('admin_auth') === 'true' || localStorage.getItem('marketplace_admin_auth') === 'true';

          if (!isOwnerUser && !isAdminUser) {
            alert('Acesso negado: Você só pode editar os seus próprios anúncios.');
            navigate('/marketplace/meus-anuncios');
            return;
          }

          // Determinar tipo correto do anúncio existente
          let inferredType: 'Venda' | 'Troca' | 'Gratis' = 'Venda';
          if (ad.type === 'Gratis' || ad.type === 'Doacao' || ad.type === 'Doação') {
            inferredType = 'Gratis';
          } else if (ad.type === 'Troca') {
            inferredType = 'Troca';
          } else {
            inferredType = 'Venda';
          }

          const rawPrice = Number(ad.price);
          const priceStr = (!isNaN(rawPrice) && rawPrice > 0) ? String(rawPrice) : '';

          setFormData({
            title: ad.title || '',
            category_id: ad.category_id ? String(ad.category_id) : '',
            ad_type: inferredType,
            price: inferredType === 'Venda' ? priceStr : (inferredType === 'Troca' && priceStr ? priceStr : ''),
            condition: ad.condition || 'Usado',
            accepts_trade: (ad.accepts_trade === true || inferredType === 'Troca') ? 'sim' : 'nao',
            description: ad.description || '',
            brand: ad.brand || '',
            model: ad.model || '',
            state: ad.state || 'SP',
            city: ad.city || 'Campinas',
            neighborhood: ad.neighborhood || user.neighborhood || 'Mário Covas',
            zip_code: ad.zip_code || '',
            whatsapp: ad.whatsapp || user.whatsapp || ''
          });

          // Carregar imagens do anúncio
          const { data: imgs } = await supabase
            .from('marketplace_listing_images')
            .select('*')
            .eq('listing_id', editId)
            .order('order_index');

          if (imgs && imgs.length > 0) {
            setImagePreviews(imgs.map(i => i.image_url));
            const pIdx = imgs.findIndex(i => i.is_primary);
            if (pIdx >= 0) setPrimaryIndex(pIdx);
          } else if (ad.image_url || ad.image) {
            setImagePreviews([ad.image_url || ad.image]);
          }
        } catch (err) {
          console.error('Erro ao carregar anúncio:', err);
          alert('Erro ao carregar dados do anúncio.');
          navigate('/marketplace/meus-anuncios');
        } finally {
          setInitialLoading(false);
        }
      } else {
        setFormData(prev => ({
          ...prev,
          neighborhood: user.neighborhood || prev.neighborhood || 'Mário Covas',
          whatsapp: user.whatsapp || prev.whatsapp || ''
        }));
      }
    };

    initAuthAndData();
  }, [navigate, contextUser, isEditing, editId]);

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
      if (imagePreviews.length + files.length > 5) {
        alert('Você pode enviar no máximo 5 fotos por anúncio.');
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
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    const newFiles = [...imageFiles];
    if (newFiles.length > index) {
      newFiles.splice(index, 1);
      setImageFiles(newFiles);
    }

    if (primaryIndex === index) {
      setPrimaryIndex(0);
    } else if (primaryIndex > index) {
      setPrimaryIndex(primaryIndex - 1);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (loading) return; // Prevenção de duplicidade por duplo clique

    if (!formData.title.trim()) {
      alert('Por favor, informe o título do produto.');
      return;
    }

    if (imagePreviews.length === 0) {
      alert('Por favor, adicione pelo menos uma foto para o seu anúncio.');
      return;
    }

    setLoading(true);

    try {
      const user = currentUser || (await getAuthUser());
      if (!user || !user.id) {
        alert('🔒 Você precisa estar conectado na sua conta para publicar ou editar anúncios.');
        navigate(`/login?redirect=${encodeURIComponent(isEditing ? `/marketplace/editar/${editId}` : '/marketplace/anunciar')}`);
        setLoading(false);
        return;
      }
      const userId = user.id;

      // Garantir existência de perfil na tabela profiles para que a chave estrangeira nunca falhe
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          name: user.name || 'Morador do Bairro',
          neighborhood: user.neighborhood || formData.neighborhood.trim() || 'Mário Covas',
          whatsapp: user.whatsapp || formData.whatsapp.trim() || ''
        }, { onConflict: 'id' });
      } catch (_) {}

      const isGratis = formData.ad_type === 'Gratis';
      const isTroca = formData.ad_type === 'Troca';
      const isVenda = formData.ad_type === 'Venda';

      if (isVenda) {
        const pNum = parseFloat(String(formData.price).replace(',', '.'));
        if (isNaN(pNum) || pNum <= 0) {
          alert('Por favor, informe o preço de venda do anúncio.');
          setLoading(false);
          return;
        }
      }

      const priceNum = parseFloat(String(formData.price).replace(',', '.'));
      const finalPrice = isGratis ? 0 : (isNaN(priceNum) ? 0 : priceNum);
      const effectiveType: 'Venda' | 'Troca' | 'Gratis' = isGratis ? 'Gratis' : (isTroca ? 'Troca' : 'Venda');
      const finalAcceptsTrade = isTroca ? true : (isVenda && formData.accepts_trade === 'sim');

      const primaryImage = imagePreviews[primaryIndex] || imagePreviews[0] || '';

      const listingPayload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: finalPrice,
        type: effectiveType,
        condition: formData.condition,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        accepts_trade: finalAcceptsTrade,
        state: formData.state || 'SP',
        city: formData.city || 'Campinas',
        neighborhood: formData.neighborhood.trim() || 'Mário Covas',
        seller_name: user?.name || 'Vendedor do Bairro',
        seller_avatar: user?.avatar || null,
        whatsapp: formData.whatsapp.trim(),
        status: 'approved'
      };

      if (userId) {
        listingPayload.user_id = userId;
      }

      let targetId = editId;

      if (isEditing && editId) {
        // Validação de segurança: garantir que o usuário é o dono ou admin antes de salvar no banco
        const { data: existingAd } = await supabase
          .from('marketplace_listings')
          .select('user_id, seller_name')
          .eq('id', editId)
          .single();

        const isOwnerUser = existingAd && (
          (existingAd.user_id && userId && String(existingAd.user_id) === String(userId)) ||
          (!existingAd.user_id && user?.name && existingAd.seller_name && user.name.trim().toLowerCase() === existingAd.seller_name.trim().toLowerCase())
        );
        const isAdminUser = localStorage.getItem('admin_auth') === 'true' || localStorage.getItem('marketplace_admin_auth') === 'true';

        if (!isOwnerUser && !isAdminUser) {
          throw new Error('Acesso negado: Você não possui permissão para modificar este anúncio.');
        }

        // Atualizar anúncio existente com fallback automático caso colunas extras não existam no banco
        const attemptUpdate = async (payload: any) => {
          return await supabase
            .from('marketplace_listings')
            .update(payload)
            .eq('id', editId);
        };

        let { error: updateError } = await attemptUpdate(listingPayload);

        // Se der erro de coluna inexistente no schema cache, remove a coluna causadora e tenta novamente
        while (updateError && updateError.message && updateError.message.includes("Could not find the '")) {
          const match = updateError.message.match(/Could not find the '([^']+)' column/);
          if (match && match[1] && listingPayload[match[1]] !== undefined) {
            delete listingPayload[match[1]];
            const retry = await attemptUpdate(listingPayload);
            updateError = retry.error;
          } else {
            break;
          }
        }

        // Se der erro de restrição de chave estrangeira foreign key constraint no user_id, assegura profiles e tenta novamente COM user_id
        if (updateError && (updateError.message?.includes('foreign key') || updateError.message?.includes('violates foreign key constraint') || updateError.message?.includes('marketplace_listings_user_id_fkey'))) {
          try {
            await supabase.from('profiles').upsert({
              id: userId,
              name: user?.name || 'Morador do Bairro',
              neighborhood: user?.neighborhood || formData.neighborhood.trim() || 'Mário Covas',
              whatsapp: user?.whatsapp || formData.whatsapp.trim() || ''
            }, { onConflict: 'id' });
          } catch (_) {}
          const retry = await attemptUpdate(listingPayload);
          updateError = retry.error;
        }

        if (updateError) throw updateError;

        // Atualizar imagens (até 5 fotos)
        await supabase.from('marketplace_listing_images').delete().eq('listing_id', editId);
        if (imagePreviews.length > 0) {
          const imagesPayload = imagePreviews.slice(0, 5).map((imgUrl, idx) => ({
            listing_id: editId,
            image_url: imgUrl,
            is_primary: idx === primaryIndex,
            order_index: idx
          }));
          await supabase.from('marketplace_listing_images').insert(imagesPayload);
        }
      } else {
        // Criar novo anúncio com tratamento resiliente de schema
        const attemptInsert = async (payload: any) => {
          return await supabase
            .from('marketplace_listings')
            .insert(payload)
            .select()
            .single();
        };

        let { data: newListing, error: listingError } = await attemptInsert(listingPayload);

        // Se der erro de coluna inexistente no schema cache, remove e tenta novamente
        while (listingError && listingError.message && listingError.message.includes("Could not find the '")) {
          const match = listingError.message.match(/Could not find the '([^']+)' column/);
          if (match && match[1] && listingPayload[match[1]] !== undefined) {
            delete listingPayload[match[1]];
            const retry = await attemptInsert(listingPayload);
            newListing = retry.data;
            listingError = retry.error;
          } else {
            break;
          }
        }

        // Se houver erro de foreign key constraint, assegura o perfil e tenta novamente mantendo o user_id
        if (listingError && (listingError.message?.includes('foreign key') || listingError.message?.includes('violates foreign key constraint') || listingError.message?.includes('marketplace_listings_user_id_fkey'))) {
          try {
            await supabase.from('profiles').upsert({
              id: userId,
              name: user?.name || 'Morador do Bairro',
              neighborhood: user?.neighborhood || formData.neighborhood.trim() || 'Mário Covas',
              whatsapp: user?.whatsapp || formData.whatsapp.trim() || ''
            }, { onConflict: 'id' });
          } catch (_) {}
          const retry = await attemptInsert(listingPayload);
          newListing = retry.data;
          listingError = retry.error;
        }

        if (listingError) throw listingError;
        targetId = newListing.id;

        if (targetId && imagePreviews.length > 0) {
          const imagesPayload = imagePreviews.slice(0, 5).map((imgUrl, idx) => ({
            listing_id: targetId,
            image_url: imgUrl,
            is_primary: idx === primaryIndex,
            order_index: idx
          }));
          await supabase.from('marketplace_listing_images').insert(imagesPayload);
        }
      }

      try {
        localStorage.removeItem('cache_marketplace_listings');
      } catch (_) {}

      setSavedAdId(targetId);
      setSuccess(true);
      // Redirecionamento rápido e fluido para o anúncio
      setTimeout(() => {
        navigate(`/marketplace/anuncio/${targetId}?refresh=${Date.now()}`);
      }, 800);

    } catch (err: any) {
      alert('Erro ao salvar anúncio: ' + (err.message || 'Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff6500]"></div>
      </div>
    );
  }

  if (success) {
    const finalAdUrl = `/marketplace/anuncio/${savedAdId || editId}?refresh=${Date.now()}`;
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">
          {isEditing ? 'Anúncio Atualizado!' : 'Anúncio Publicado com Sucesso!'}
        </h1>
        <p className="text-slate-600 max-w-sm mb-6 leading-relaxed text-sm">
          {isEditing 
            ? 'As alterações foram salvas e seu produto já está atualizado no Marketplace.'
            : 'Seu produto já está visível para todos os moradores no Marketplace do Fala do Bairro.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(finalAdUrl)}
            className="w-full bg-[#ff6500] hover:bg-[#e95600] text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Anúncio
          </button>
          <button
            onClick={() => navigate('/marketplace/meus-anuncios')}
            className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold py-3 px-5 rounded-2xl transition-all cursor-pointer text-xs"
          >
            Meus Anúncios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] pb-24">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[760px] mx-auto h-[64px] flex items-center justify-between px-4">
          <button 
            type="button" 
            onClick={() => {
              if (isEditing && editId) {
                navigate(`/marketplace/anuncio/${editId}`);
              } else {
                navigate(-1);
              }
            }} 
            className="flex items-center gap-2 text-slate-600 font-bold hover:text-[#ff6500] transition-colors cursor-pointer text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" /> {isEditing ? 'Voltar para o Anúncio' : 'Cancelar'}
          </button>
          <div className="font-extrabold text-slate-900 text-base">
            {isEditing ? 'Editar Anúncio' : 'Criar Novo Anúncio'}
          </div>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto p-4 sm:p-6 mt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SEÇÃO 1: FOTOS */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#ff6500]" /> Fotos do Produto
              </label>
              <span className="text-xs font-bold text-slate-400">
                {imagePreviews.length}/5 fotos
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Dica: Anúncios com boas fotos vendem até 3x mais rápido. A primeira foto será a capa principal.
            </p>

            {/* Grid de previews */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
              {imagePreviews.map((preview, index) => (
                <div 
                  key={index} 
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                    primaryIndex === index ? 'border-[#ff6500] ring-2 ring-orange-400/30 shadow-md' : 'border-slate-200'
                  }`}
                  onClick={() => setPrimaryIndex(index)}
                  title="Clique para definir como foto de capa"
                >
                  <img src={preview} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  
                  {primaryIndex === index && (
                    <span className="absolute bottom-1.5 left-1.5 bg-[#ff6500] text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                      Capa
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {imagePreviews.length < 5 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#ff6500] bg-slate-50 hover:bg-orange-50/40 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-[#ff6500] p-2 text-center">
                  <UploadCloud className="w-6 h-6 mb-1" />
                  <span className="text-[11px] font-bold leading-tight">Adicionar foto</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>
          </div>

          {/* SEÇÃO 2: TIPO DO ANÚNCIO (VENDA / TROCA / DOAÇÃO) */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
            <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-3">
              Modalidade do Anúncio
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'Venda', label: 'Venda', icon: '💰', desc: 'Preço definido' },
                { id: 'Troca', label: 'Troca', icon: '🔄', desc: 'Permuta ou troca' },
                { id: 'Gratis', label: 'Doação', icon: '🎁', desc: '100% Gratuito' }
              ].map(opt => {
                const isSelected = formData.ad_type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      ad_type: opt.id as any,
                      accepts_trade: opt.id === 'Troca' ? 'sim' : (opt.id === 'Gratis' ? 'nao' : prev.accepts_trade),
                      price: opt.id === 'Gratis' ? '0' : (opt.id === 'Venda' && prev.price === '0' ? '' : prev.price)
                    }))}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? opt.id === 'Troca' 
                          ? 'border-purple-500 bg-purple-50/80 text-purple-700 font-black shadow-xs ring-2 ring-purple-400/30'
                          : opt.id === 'Gratis'
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-700 font-black shadow-xs ring-2 ring-emerald-400/30'
                          : 'border-[#ff6500] bg-orange-50/80 text-[#ff6500] font-black shadow-xs ring-2 ring-orange-400/30'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="text-xs sm:text-sm font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 3: INFORMAÇÕES BÁSICAS */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
              Informações do Produto
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Título do Anúncio *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Sofá retrátil 3 lugares cinza impecável"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#ff6500] outline-none transition-colors"
                maxLength={90}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Categoria *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#ff6500] outline-none transition-colors cursor-pointer"
                  required
                >
                  <option value="">Selecione a categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon || '📦'} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Estado de Conservação
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#ff6500] outline-none transition-colors cursor-pointer"
                >
                  <option value="Novo">✨ Novo (Lacrado / Sem uso)</option>
                  <option value="Excelente">⭐ Excelente (Pouco uso)</option>
                  <option value="Usado">👍 Bom estado (Usado)</option>
                  <option value="Marcas de Uso">🔧 Com detalhes de uso</option>
                </select>
              </div>
            </div>

            {formData.ad_type === 'Venda' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Preço de Venda (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-sm font-black text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-base font-black text-emerald-700 focus:bg-white focus:border-emerald-500 outline-none transition-colors"
                    required={formData.ad_type === 'Venda'}
                  />
                </div>
              </div>
            )}

            {formData.ad_type === 'Venda' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="trade_check"
                  checked={formData.accepts_trade === 'sim'}
                  onChange={e => setFormData(prev => ({ ...prev, accepts_trade: e.target.checked ? 'sim' : 'nao' }))}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="trade_check" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-purple-600" /> Também aceito propostas de troca por outros itens
                </label>
              </div>
            )}

            {formData.ad_type === 'Troca' && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/80 text-purple-900 text-xs sm:text-sm flex items-start gap-3">
                <Repeat className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black text-purple-800 mb-0.5">Modalidade Troca Selecionada</strong>
                  <span className="text-purple-700 text-xs leading-relaxed">
                    Este item será publicado para <strong>Troca / Permuta</strong>. Lembre-se de descrever na descrição o que você gostaria de receber em troca!
                  </span>
                </div>
              </div>
            )}

            {formData.ad_type === 'Gratis' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs sm:text-sm flex items-start gap-3">
                <span className="text-xl shrink-0">🎁</span>
                <div>
                  <strong className="block font-black text-emerald-800 mb-0.5">Modalidade Doação Grátis Selecionada</strong>
                  <span className="text-emerald-700 text-xs leading-relaxed">
                    Este item será publicado como <strong>100% gratuito (Doação)</strong> para moradores da comunidade.
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Descrição Completa *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Descreva detalhes como medidas, funcionamento, tempo de uso e motivo da venda ou troca..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#ff6500] outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* SEÇÃO 4: LOCALIZAÇÃO E CONTATO */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#ff6500]" /> Localização & Contato
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Bairro *
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  placeholder="Ex: Mário Covas"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#ff6500] outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  WhatsApp para Contato *
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="DDD + Número (Ex: 19999999999)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#ff6500] outline-none transition-colors"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" /> 
              Os compradores iniciarão a conversa direto no seu WhatsApp ao clicarem no anúncio.
            </p>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6500] hover:bg-[#e95600] disabled:bg-orange-300 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/20 text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Salvando Anúncio...</span>
                </>
              ) : (
                <span>{isEditing ? 'Salvar Alterações' : 'Publicar Anúncio Agora'}</span>
              )}
            </button>

            {isEditing && editId && (
              <button
                type="button"
                onClick={() => navigate(`/marketplace/anuncio/${editId}`)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o Anúncio sem salvar
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
