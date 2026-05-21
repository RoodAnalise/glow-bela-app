import { GoogleGenAI } from '@google/genai';

// Hardcoded for immediate functionality (Security warning: visible in source)
const API_KEY = 'AIzaSyCCRoNRqvZG0aIgobrGnI9dMTHyLjaQZ6c';
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface AICaptionResult {
  caption: string;
  hashtags: string;
  storyText: string;
}

export async function generateInstagramCaption(productName: string, category: string, description: string): Promise<AICaptionResult> {
  const prompt = `Você é uma social media especializada em cosméticos de luxo. Crie conteúdo para a marca "Glow Bella Cosméticos".

Produto: ${productName}
Categoria: ${category}
Descrição: ${description}

A Glow Bella é uma loja online de cosméticos e autocuidado com produtos modernos, cheirosos e acessíveis. Personalidade: elegante, delicada, moderna, feminina, sofisticada, acessível, acolhedora.

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
      caption: `✨ ${productName}\n\n${description}\n\nDescubra o poder da beleza com Glow Bella Cosméticos. 💖`,
      hashtags: '#GlowBela #Cosmeticos #Beleza #SkinCare #Makeup #Luxo #CuidadosPele #GlowUp',
      storyText: `✨ Novidade!\n${productName}`
    };
  }
}

export interface ProductAnalysisResult {
  name: string;
  category: string;
  description: string;
}

export async function analyzeProductImage(imageBase64: string): Promise<ProductAnalysisResult> {
  const base64Data = imageBase64.split(',')[1] || imageBase64;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        },
        `Analise esta imagem de produto cosmético e extraia as informações. Retorne APENAS um JSON neste formato exato:
{
  "name": "Nome sofisticado do produto (máximo 50 caracteres)",
  "category": "Categoria do produto (ex: SkinCare, Maquiagem, Cabelos, Perfumes, Corpo, Labios, Unhas)",
  "description": "Descrição de venda persuasiva e sofisticada destacando benefícios e características (máximo 150 caracteres, tom elegante e acolhedor)"
}

A marca é Glow Bella Cosméticos - elegante, delicada, moderna, feminina, sofisticada e acessível.

Se não for um produto cosmético, retorne:
{
  "name": "",
  "category": "",
  "description": ""
}

Não inclua markdown ou código, apenas o JSON puro.`
      ]
    });

    const text = response.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || '',
        category: parsed.category || '',
        description: parsed.description || ''
      };
    }
    throw new Error('Invalid response format');
  } catch (err) {
    console.error('AI image analysis failed:', err);
    return {
      name: '',
      category: '',
      description: ''
    };
  }
}

export function isAIConfigured(): boolean {
  return true;
}
