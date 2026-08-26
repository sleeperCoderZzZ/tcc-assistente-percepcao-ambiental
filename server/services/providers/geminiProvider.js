const BasePerceptionProvider = require('./baseProvider');

/**
 * Provedor Gemini VLM (Vision-Language Model) Otimizado para Resposta Direta a Perguntas.
 * Responde à dúvida do usuário em linguagem natural fluida e reserva alertas de perigo
 * apenas para riscos físicos corporais iminentes.
 */
class GeminiPerceptionProvider extends BasePerceptionProvider {
  constructor(apiKey) {
    super('GeminiPerceptionProvider');
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
  }

  async analyzePerception({ imageBuffer, imageMimeType, userQuestion }) {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY não configurada no ambiente. Defina a variável de ambiente ou altere AI_PROVIDER=mock.");
    }

    const mime = imageMimeType || 'image/jpeg';
    const base64Data = imageBuffer.toString('base64');
    const prompt = `Você é um assistente auditivo de percepção ambiental para pessoas com deficiência visual.
Sua missão é RESPONDER DIRETA E NATURALMENTE À PERGUNTA FEITA PELO USUÁRIO com base na imagem recebida.

Pergunta do Usuário: "${userQuestion || 'O que tem na minha frente?'}"

DIRETRIZES IMPORTANTES DE RESPOSTA (Siga estritamente para evitar alucinações):
1. RESPOSTA DIRETA: Responda exatamente ao que foi perguntado, baseando-se apenas no que você REALMENTE VÊ. Se há uma pessoa na sua frente, diga isso (ex: "À sua frente há uma pessoa vestindo camisa azul com fone de ouvido, a cerca de 70 cm").
2. FOCO NA PESSOA: Se você detectar partes de um corpo humano (rosto, peito, roupa, fones, braços), classifique "humanDetected": true. Não ignore a pessoa só porque ela está muito perto (close-up).
3. PROIBIÇÃO DE ALUCINAÇÕES: NUNCA INVENTE que há "desníveis", "cadeiras", "corredores livres" ou "caminho livre" se você não estiver vendo isso claramente. Se a imagem mostra apenas a roupa/rosto de alguém muito perto, o ambiente está "obstruído" pela pessoa.
4. ALERTAS DE EMERGÊNCIA (priority = HIGH): Apenas liste 'hazards' e use priority="HIGH" se houver um PERIGO FÍSICO REAL E IMINENTE de acidente grave (como um buraco enorme no chão ou um carro vindo na sua direção). Estar perto de uma pessoa, segurar um objeto ou estar de frente para uma parede NÃO é risco iminente de queda. Portanto, na dúvida, use priority="NORMAL" e deixe "hazards" vazio ([]).

RETORNE ESTRITAMENTE O SEGUINTE JSON:
{
  "priority": "NORMAL", (ou "HIGH" SOMENTE em perigos iminentes e inquestionáveis de colisão/queda grave)
  "humanDetected": true ou false,
  "humanDetails": "descrição da pessoa se encontrada, senão null",
  "proximityEstimate": "distância estimada, ex: '0,5 metro'",
  "hazards": ["lista de riscos graves reais. NUNCA invente itens. Deixe vazio [] se não houver"],
  "description": "descrição realista e direta do que é visto, sem inventar cenários de fundo",
  "speechText": "resposta natural para ser lida em voz alta ao usuário"
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mime,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro no provedor Gemini (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    try {
      const parsed = JSON.parse(rawContent);
      return {
        priority: parsed.priority || 'NORMAL',
        humanDetected: parsed.humanDetected || false,
        humanDetails: parsed.humanDetails || null,
        proximityEstimate: parsed.proximityEstimate || 'Aproximadamente 1 metro',
        hazards: parsed.hazards || [],
        description: parsed.description || 'Imagem analisada.',
        speechText: parsed.speechText || parsed.description || 'Análise concluída.',
        provider: this.name,
        processedInMemoryOnly: true
      };
    } catch (e) {
      return {
        priority: 'NORMAL',
        humanDetected: false,
        humanDetails: null,
        proximityEstimate: 'Não determinado',
        hazards: [],
        description: rawContent || 'Descrição gerada pelo modelo.',
        speechText: rawContent || 'Análise concluída.',
        provider: this.name,
        processedInMemoryOnly: true
      };
    }
  }
}

module.exports = GeminiPerceptionProvider;
