import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export interface AICaptionResult {
  caption: string;
  hashtags: string;
  storyText: string;
}

export async function generateInstagramCaption(productName: string, category: string, description: string): Promise<AICaptionResult> {
  if (!ai) {
    return {
      caption: `✨ ${productName}\n\n${description}\n\n#GlowBela #Cosmeticos`,
      hashtags: '#GlowBela #Cosmeticos #Beleza',
      storyText: `Novidade Glow Bela!\n${productName}`
    };
  }

  const prompt = `Você é uma social media especializada em cosméticos de luxo. Crie conteúdo para a marca "Glow Bela Cosméticos".

Produto: ${productName}
Categoria: ${category}
Descrição: ${description}

Retorne APENAS um JSON neste formato exato:
{
  "caption": "Legenda para post do Instagram (2-3 frases, tom sofisticado e convidativo, com emojis)",
  "hashtags": "5-8 hashtags relevantes separadas por espaço",
  "storyText": "Texto curto para stories (max 10 palavras, impactante)"
}

Não inclua markdown ou código, apenas o JSON puro.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response format');
  } catch (err) {
    console.error('AI caption generation failed:', err);
    return {
      caption: `✨ ${productName}\n\n${description}\n\nDescubra o poder da beleza com Glow Bela Cosméticos. 💖`,
      hashtags: '#GlowBela #Cosmeticos #Beleza #SkinCare #Makeup #Luxo #CuidadosPele #GlowUp',
      storyText: `✨ Novidade!\n${productName}`
    };
  }
}

export function isAIConfigured(): boolean {
  return !!API_KEY;
}
