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
    const base64Data = imageBuffer ? imageBuffer.toString('base64') : null;
    const prompt = `Assistente visual para cegos. Analise a imagem real. Pergunta: "${userQuestion || 'O que tem na minha frente?'}"
Regras: 1. Apenas elementos visíveis reais. 2. Estime profundidade/distância exata (ex: '0,4 m', '1,2 m', '2,5 m'). 3. humanDetected=true apenas se houver pessoa real. 4. priority=HIGH e hazards APENAS para risco iminente de colisão/queda. 5. speechText: fala humana, clara e direta.

Retorne APENAS JSON:
{"priority":"NORMAL"|"HIGH","humanDetected":bool,"humanDetails":string|null,"proximityEstimate":string,"detectedObjects":[string],"hazards":[string],"description":string,"speechText":string}`;

    const parts = [{ text: prompt }];
    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: mime,
          data: base64Data
        }
      });
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    };

    // Lista de modelos candidatos ativos do Gemini
    const candidateModels = Array.from(new Set([
      this.preferredModel,
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-2.5-flash-lite',
      'gemini-3.7-flash',
      'gemini-pro-latest'
    ].filter(Boolean)));

    let lastError = null;
    const preferredModel = candidateModels[0];

    for (const model of candidateModels) {
      const isFallback = model !== preferredModel;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[GeminiPerceptionProvider] Modelo ${model} indisponível ou recusou a requisição (HTTP ${response.status}). Alternando para o próximo modelo candidato...`);
          lastError = new Error(`HTTP ${response.status} no modelo ${model}: ${errText.substring(0, 100)}`);
          continue;
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
            executedModel: model,
            preferredModel: preferredModel,
            isFallback: isFallback,
            fallbackReason: isFallback ? `Fallback para ${model} (Modelo principal ${preferredModel} indisponível)` : null,
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
            executedModel: model,
            preferredModel: preferredModel,
            isFallback: isFallback,
            fallbackReason: isFallback ? `Fallback para ${model} (Modelo principal ${preferredModel} indisponível)` : null,
            processedInMemoryOnly: true
          };
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error("Nenhum modelo do Gemini respondeu com sucesso (todos indisponíveis ou com erro).");
  }
}

module.exports = GeminiPerceptionProvider;
