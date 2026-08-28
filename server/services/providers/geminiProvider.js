const BasePerceptionProvider = require('./baseProvider');

/**
 * Provedor Gemini VLM (Vision-Language Model) Otimizado para Resposta Direta a Perguntas.
 * Responde à dúvida do usuário em linguagem natural fluida e reserva alertas de perigo
 * apenas para riscos físicos corporais iminentes.
 */
class GeminiPerceptionProvider extends BasePerceptionProvider {
  constructor(apiKey, modelName) {
    super('GeminiPerceptionProvider');
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.preferredModel = modelName || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  async analyzePerception({ imageBuffer, imageMimeType, userQuestion }) {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY não configurada no ambiente. Defina a variável de ambiente ou altere AI_PROVIDER=mock.");
    }

    const mime = imageMimeType || 'image/jpeg';
    const base64Data = imageBuffer.toString('base64');
    const prompt = `Você é um assistente auditivo de percepção ambiental para pessoas com deficiência visual.
Sua missão é ANALISAR A IMAGEM EM DETALHES, IDENTIFICAR TODOS OS OBJETOS E ELEMENTOS PRESENTES E RESPONDER DIRETA E NATURALMENTE À PERGUNTA FEITA PELO USUÁRIO.

Pergunta do Usuário: "${userQuestion || 'O que tem na minha frente?'}"

DIRETRIZES DE RESPOSTA E ANÁLISE DE IMAGEM:
1. DETECÇÃO REAL DE OBJETOS: Identifique individualmente todos os objetos visíveis (ex: mesa, cadeira, garrafa, monitor, parede, porta, celular, pessoa, etc.) e inclua-os na lista 'detectedObjects'.
2. VERACIDADE ABSOLUTA: Descreva APENAS o que você REALMENTE enxerga na imagem. NUNCA invente cores de roupa, fones de ouvido ou distâncias fixas se eles não existirem na foto.
3. DETECÇÃO HUMANA: Defina "humanDetected": true SOMENTE se houver um ser humano visível na imagem. Se não houver pessoa, defina "humanDetected": false e "humanDetails": null.
4. ALERTAS DE EMERGÊNCIA: Defina "priority": "HIGH" e liste 'hazards' APENAS se houver risco iminente de queda ou colisão física grave. Caso contrário, use "priority": "NORMAL" e "hazards": [].

RETORNE ESTRITAMENTE O SEGUINTE JSON:
{
  "priority": "NORMAL" ou "HIGH",
  "humanDetected": true ou false,
  "humanDetails": "descrição resumida da pessoa se houver, senão null",
  "proximityEstimate": "distância estimada até o elemento principal (ex: '1,5 metro' ou 'Desobstruído')",
  "detectedObjects": ["lista", "de", "objetos", "e", "elementos", "visíveis"],
  "hazards": ["perigos iminentes de colisão/queda ou []"],
  "description": "descrição objetiva do que está presente na imagem",
  "speechText": "resposta clara e natural para leitura em voz alta ao usuário"
}`;

    // Lista de modelos candidatos (v3+, v2.5, Pro e Flash) em ordem de preferência
    const candidateModels = Array.from(new Set([
      this.preferredModel,
      'gemini-3.5-pro',
      'gemini-3.5-flash',
      'gemini-3.0-pro',
      'gemini-3.0-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.0-pro-exp',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ].filter(Boolean)));

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

    let lastError = null;

    for (const model of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          // Se for 503 (High Demand), 429 (Rate Limit), 404 (Not Found) ou 500 (Internal Error), tenta o próximo modelo
          if ([503, 429, 404, 500].includes(response.status)) {
            console.warn(`[GeminiPerceptionProvider] Modelo ${model} indisponível (HTTP ${response.status}). Alternando para o próximo modelo candidato...`);
            lastError = new Error(`Erro no provedor Gemini modelo ${model} (${response.status}): ${errText}`);
            continue;
          }
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
            proximityEstimate: parsed.proximityEstimate || 'Distância não especificada',
            detectedObjects: Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects : [],
            hazards: Array.isArray(parsed.hazards) ? parsed.hazards : [],
            description: parsed.description || 'Análise da imagem concluída.',
            speechText: parsed.speechText || parsed.description || 'Análise concluída.',
            provider: `${this.name} (${model})`,
            processedInMemoryOnly: true
          };
        } catch (e) {
          return {
            priority: 'NORMAL',
            humanDetected: false,
            humanDetails: null,
            proximityEstimate: 'Não determinado',
            detectedObjects: [],
            hazards: [],
            description: rawContent || 'Descrição gerada pelo modelo.',
            speechText: rawContent || 'Análise concluída.',
            provider: `${this.name} (${model})`,
            processedInMemoryOnly: true
          };
        }
      } catch (err) {
        if (err.message && (err.message.includes('503') || err.message.includes('429') || err.message.includes('404') || err.message.includes('500'))) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error("Nenhum modelo do Gemini respondeu com sucesso (todos indisponíveis ou com erro).");
  }
}

module.exports = GeminiPerceptionProvider;
