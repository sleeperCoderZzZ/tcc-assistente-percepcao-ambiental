const BasePerceptionProvider = require('./baseProvider');

/**
 * Provedor OpenAI GPT VLM (Vision-Language Model)
 * Utiliza a API Chat Completions (gpt-4o-mini / gpt-4o) para análise de imagens em tempo real.
 * Não persiste dados em disco, mantendo a garantia de Retenção Zero de Dados.
 */
class OpenAIPerceptionProvider extends BasePerceptionProvider {
  constructor(apiKey, modelName) {
    super('OpenAIPerceptionProvider');
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.modelName = modelName || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async analyzePerception({ imageBuffer, imageMimeType, userQuestion, visualFeatures }) {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY não configurada no ambiente. Defina a variável de ambiente ou altere AI_PROVIDER=gemini ou AI_PROVIDER=mock.");
    }

    const mime = imageMimeType || 'image/jpeg';
    const base64Data = imageBuffer.toString('base64');
    const dataUrl = `data:${mime};base64,${base64Data}`;

    const prompt = `Assistente visual para cegos. Analise a imagem real. Pergunta: "${userQuestion || 'O que tem na minha frente?'}"
Regras: 1. Apenas elementos visíveis reais. 2. Estime profundidade/distância exata (ex: '0,4 m', '1,2 m', '2,5 m'). 3. humanDetected=true apenas se houver pessoa real. 4. priority=HIGH e hazards APENAS para risco iminente de colisão/queda. 5. speechText: fala humana, clara e direta.

Retorne APENAS JSON:
{"priority":"NORMAL"|"HIGH","humanDetected":bool,"humanDetails":string|null,"proximityEstimate":string,"detectedObjects":[string],"hazards":[string],"description":string,"speechText":string}`;

    const payload = {
      model: this.modelName,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
    }

    const resJson = await response.json();
    const messageContent = resJson.choices?.[0]?.message?.content;

    if (!messageContent) {
      throw new Error("Resposta inválida da OpenAI API.");
    }

    const parsed = JSON.parse(messageContent);

    return {
      priority: parsed.priority || 'NORMAL',
      humanDetected: Boolean(parsed.humanDetected),
      humanDetails: parsed.humanDetails || null,
      proximityEstimate: parsed.proximityEstimate || 'Aproximada',
      detectedObjects: Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects : [],
      hazards: Array.isArray(parsed.hazards) ? parsed.hazards : [],
      description: parsed.description || 'Descrição do ambiente fornecida pelo OpenAI VLM.',
      speechText: parsed.speechText || parsed.description || 'Análise concluída.',
      provider: `${this.name} (${this.modelName})`,
      processedInMemoryOnly: true
    };
  }
}

module.exports = OpenAIPerceptionProvider;
