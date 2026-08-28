const BasePerceptionProvider = require('./baseProvider');
const VisualAnalysisAgent = require('../agents/visualAnalysisAgent');
const MockPerceptionProvider = require('./mockProvider');
const GeminiPerceptionProvider = require('./geminiProvider');
const OpenAIPerceptionProvider = require('./openaiProvider');

/**
 * Provedor Multi-Agente Híbrido (Multi-Agent Perception Ensemble).
 * Prioriza responder a pergunta exata feita pelo usuário em linguagem natural.
 * Reserva alertas vermelhos de segurança apenas para perigos físicos de queda/colisão.
 */
class HybridEnsemblePerceptionProvider extends BasePerceptionProvider {
  constructor(vlmType = 'auto') {
    super('MultiAgentHybridEnsembleProvider');
    
    const type = (vlmType || process.env.AI_PROVIDER || 'auto').toLowerCase();

    if (type === 'openai' || type === 'gpt' || type === 'gpt-4o') {
      this.vlmAgent = new OpenAIPerceptionProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL);
    } else if (type === 'gemini' || (process.env.GEMINI_API_KEY && type !== 'mock' && !process.env.OPENAI_API_KEY)) {
      this.vlmAgent = new GeminiPerceptionProvider(process.env.GEMINI_API_KEY);
    } else if (process.env.OPENAI_API_KEY && type !== 'mock') {
      this.vlmAgent = new OpenAIPerceptionProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL);
    } else {
      this.vlmAgent = new MockPerceptionProvider();
    }
  }

  async analyzePerception({ imageBuffer, imageMimeType, userQuestion, visualFeatures }) {
    // 1. Agente 1: Análise Visual de Pixels
    const pixelAnalysis = VisualAnalysisAgent.analyzeImageFeatures({
      visualFeatures,
      imageBuffer
    });

    // 2. Agente 2: Inferência VLM
    let vlmAnalysis;
    try {
      vlmAnalysis = await this.vlmAgent.analyzePerception({
        imageBuffer,
        imageMimeType,
        userQuestion: userQuestion || 'O que tem na minha frente?',
        visualFeatures
      });
    } catch (err) {
      console.warn('[MULTI-AGENTE WARNING]: Falha no agente VLM remoto. Utilizando síntese local.', err.message);
      vlmAnalysis = null;
    }

    // 3. Agente 3: Síntese e Fusão
    const humanDetected = (vlmAnalysis && typeof vlmAnalysis.humanDetected === 'boolean') 
      ? vlmAnalysis.humanDetected 
      : pixelAnalysis.humanDetected;

    const hasHeadphones = pixelAnalysis.hasHeadphones;
    const clothingColor = pixelAnalysis.clothingColor;
    const proximity = vlmAnalysis ? vlmAnalysis.proximityEstimate : (humanDetected ? '0,9 metro' : 'Desobstruído');

    // Combinar e desduplicar a lista de objetos detectados pelos agentes
    const rawObjects = [
      ...(pixelAnalysis.detectedObjects || []),
      ...(vlmAnalysis && Array.isArray(vlmAnalysis.detectedObjects) ? vlmAnalysis.detectedObjects : [])
    ];
    const detectedObjects = Array.from(new Set(rawObjects.filter(Boolean)));

    // Determinar se há perigo real de emergência
    const realHazards = (vlmAnalysis && vlmAnalysis.hazards) ? vlmAnalysis.hazards : [];
    const isEmergency = realHazards.length > 0 && vlmAnalysis.priority === 'HIGH';

    // Montar texto de resposta direta à pergunta do usuário
    let speechText = '';
    if (vlmAnalysis && vlmAnalysis.speechText) {
      speechText = vlmAnalysis.speechText;
    } else if (humanDetected) {
      speechText = `À sua frente há uma pessoa identificada${clothingColor && clothingColor !== 'não identificado' ? ' vestindo tom ' + clothingColor : ''}, a aproximadamente ${proximity} de distância.`;
    } else {
      speechText = `À sua frente o caminho está livre e desobstruído. Nenhuma pessoa ou obstáculo imediato detectado.`;
    }

    const descriptionText = vlmAnalysis && vlmAnalysis.description 
      ? vlmAnalysis.description 
      : `Análise do ambiente: ${humanDetected ? 'Pessoa identificada à frente (' + proximity + ').' : 'Ambiente livre.'}`;

    return {
      priority: isEmergency ? 'HIGH' : 'NORMAL',
      humanDetected: humanDetected,
      humanDetails: humanDetected ? `Pessoa a ${proximity}.` : 'Nenhuma pessoa próxima.',
      proximityEstimate: proximity,
      detectedObjects: detectedObjects,
      hazards: realHazards,
      description: descriptionText,
      speechText: speechText,
      provider: `Multi-Agente Híbrido (${this.vlmAgent.name} + VisualAnalysisAgent)`,
      processedInMemoryOnly: true
    };
  }
}

module.exports = HybridEnsemblePerceptionProvider;
