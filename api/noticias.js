import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Configuração CORS básica
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text in request body' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Você é um assistente de jornalismo hiperlocal. 
Reescreva a seguinte notícia ou relato para um portal comunitário de bairro de forma amigável, clara e objetiva.

RETORNE EXATAMENTE UM JSON VÁLIDO com os seguintes campos:
- titulo: título amigável e direto chamando a atenção para o bairro/região.
- resumo: 1 frase curta para prévia e para compartilhamento no WhatsApp.
- conteudo_html: o texto limpo formatado em HTML (<p>, <strong>, etc.), em tom amigável (cerca de 2 parágrafos).
- bairro: o nome do bairro identificado (ou "Região" se não tiver).
- categoria: escolha uma das categorias: [Obras, Segurança, Pet, Saúde, Comércio, Geral].

TEXTO ORIGINAL:
${text}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text);
      return res.status(200).json(parsed);
    } else {
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }
  } catch (error) {
    console.error('Error calling Gemini:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
