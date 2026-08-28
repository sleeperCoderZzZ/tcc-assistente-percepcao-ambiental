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
