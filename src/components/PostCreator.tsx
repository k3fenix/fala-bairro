import React from 'react';
import { MapPin, Image as ImageIcon, X, Send, Sparkles } from 'lucide-react';

interface PostCreatorProps {
  userAvatar: string;
  userName: string;
  postContent: string;
  setPostContent: (c: string) => void;
  selectedMedia: File | null;
  setSelectedMedia: (f: File | null) => void;
  postCity: string;
  setPostCity: (c: string) => void;
  postNeighborhood: string;
  setPostNeighborhood: (n: string) => void;
  postCategory: string;
  setPostCategory: (c: string) => void;
  FEED_CITIES: string[];
  handlePublish: () => void;
}

export const PostCreator: React.FC<PostCreatorProps> = ({
  userAvatar,
  userName,
  postContent,
  setPostContent,
  selectedMedia,
  setSelectedMedia,
  postCity,
  setPostCity,
  postNeighborhood,
  setPostNeighborhood,
  postCategory,
  setPostCategory,
  FEED_CITIES,
  handlePublish,
}) => {
  const firstName = userName ? userName.split(' ')[0] : 'Vizinho';

  return (
    <div className="max-w-md mx-auto md:max-w-2xl px-4 mb-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/90 p-4 sm:p-5 transition-all hover:shadow-md">
        <div className="flex gap-3 sm:gap-4 items-start">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shrink-0 shadow-xs">
            <img 
              src={userAvatar || `https://i.pravatar.cc/150?u=${userName}`} 
              alt={userName} 
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800">Publicar como <strong className="text-blue-600">{firstName}</strong></span>
              <span className="text-[10px] text-slate-400 font-semibold">• Bairro Conectado</span>
            </div>

            <textarea 
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="O que aconteceu no bairro? Compartilhe com a vizinhança..."
              rows={3}
              className="w-full bg-slate-50 text-slate-800 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-sm font-medium transition-all placeholder:text-slate-400"
            />

            {/* Preview de Mídia Selecionada */}
            {selectedMedia && (
              <div className="mt-2.5 mb-2 bg-blue-50 text-blue-700 text-xs sm:text-sm p-2.5 rounded-xl flex items-center justify-between border border-blue-100 shadow-xs">
                <span className="truncate font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" /> {selectedMedia.name}
                </span>
                <button 
                  onClick={() => setSelectedMedia(null)} 
                  className="p-1 text-blue-500 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  title="Remover mídia"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Escolha da Cidade e Bairro/Região */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-600" /> Sua Cidade *
                </label>
                <select 
                  value={postCity}
                  onChange={(e) => setPostCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 cursor-pointer shadow-xs"
                >
                  {FEED_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  🏡 Bairro / Região *
                </label>
                <input 
                  type="text"
                  value={postNeighborhood}
                  onChange={(e) => setPostNeighborhood(e.target.value)}
                  placeholder="Ex: Mário Covas, Vila Rica, Centro..."
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>

            {/* Barra Inferior com Categoria, Anexo e Botão Publicar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Tipo:</span>
                <select 
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="Informação">💡 Informação</option>
                  <option value="Aviso">📢 Aviso</option>
                  <option value="Alerta">⚠️ Alerta</option>
                  <option value="Animal">🐾 Animal</option>
                  <option value="Comércio">🏪 Comércio</option>
                  <option value="Evento">🎉 Evento</option>
                  <option value="Pergunta">❓ Pergunta</option>
                  <option value="Achados e Perdidos">🔍 Achados e Perdidos</option>
                  <option value="Outros">💬 Outros</option>
                </select>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <label className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs font-bold shadow-xs">
                  <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  <span>Foto/Vídeo</span>
                  <input 
                    type="file" 
                    accept="image/*,video/mp4,video/webm,video/quicktime" 
                    className="hidden" 
                    onChange={(e) => e.target.files && setSelectedMedia(e.target.files[0])} 
                  />
                </label>

                <button 
                  onClick={handlePublish}
                  disabled={!postContent.trim() && !selectedMedia}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> PUBLICAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreator;
