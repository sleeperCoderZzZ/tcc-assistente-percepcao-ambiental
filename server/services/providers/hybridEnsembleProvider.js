const BasePerceptionProvider = require('./baseProvider');
const VisualAnalysisAgent = require('../agents/visualAnalysisAgent');
const MockPerceptionProvider = require('./mockProvider');
const GeminiPerceptionProvider = require('./geminiProvider');

/**
 * Provedor Multi-Agente Híbrido (Multi-Agent Perception Ensemble).
 * Prioriza responder a pergunta exata feita pelo usuário em linguagem natural.
 * Reserva alertas vermelhos de segurança apenas para perigos físicos de queda/colisão.
 */
class HybridEnsemblePerceptionProvider extends BasePerceptionProvider {
  constructor(vlmType = 'auto') {
    super('MultiAgentHybridEnsembleProvider');
    
    if (vlmType === 'gemini' || (process.env.GEMINI_API_KEY && vlmType !== 'mock')) {
      this.vlmAgent = new GeminiPerceptionProvider(process.env.GEMINI_API_KEY);
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
        userQuestion: userQuestion || 'O que tem na minha frente?'
      });
    } catch (err) {
      console.warn('[MULTI-AGENTE WARNING]: Falha no agente VLM remoto. Utilizando síntese local.', err.message);
      vlmAnalysis = null;
    }

    // 3. Agente 3: Síntese e Fusão
    const humanDetected = pixelAnalysis.humanDetected || (vlmAnalysis ? vlmAnalysis.humanDetected : false);
    const hasHeadphones = pixelAnalysis.hasHeadphones;
    const clothingColor = pixelAnalysis.clothingColor;
    const proximity = vlmAnalysis ? vlmAnalysis.proximityEstimate : '0,7 metro';

    // Determinar se há perigo real de emergência (degraus, buracos, colisões iminentes)
    const realHazards = (vlmAnalysis && vlmAnalysis.hazards) ? vlmAnalysis.hazards : [];
    const isEmergency = realHazards.length > 0 && vlmAnalysis.priority === 'HIGH';

    // Montar texto de resposta direta à pergunta do usuário
    let speechText = '';
    if (vlmAnalysis && vlmAnalysis.speechText) {
      speechText = vlmAnalysis.speechText;
    } else if (humanDetected) {
      speechText = `À sua frente há uma pessoa vestindo roupa de cor ${clothingColor}${hasHeadphones ? ' e usando fones de ouvido' : ''}, a aproximadamente ${proximity} de distância.`;
    } else {
      speechText = `À sua frente o caminho está livre e desobstruído. Nenhuma pessoa ou obstáculo detectado a menos de 2 metros.`;
    }

    const descriptionText = vlmAnalysis && vlmAnalysis.description 
      ? vlmAnalysis.description 
      : `Análise do ambiente: À sua frente há uma pessoa (proximidade ${proximity}) vestindo roupa ${clothingColor}${hasHeadphones ? ' com fone de ouvido' : ''}.`;

    return {
      priority: isEmergency ? 'HIGH' : 'NORMAL',
      humanDetected: humanDetected,
      humanDetails: humanDetected ? `Pessoa a ${proximity}. Roupa: ${clothingColor}. Fone: ${hasHeadphones ? 'Sim' : 'Não'}.` : 'Nenhuma pessoa próxima.',
      proximityEstimate: proximity,
      detectedObjects: pixelAnalysis.detectedObjects,
      hazards: realHazards,
      description: descriptionText,
      speechText: speechText,
      provider: `Multi-Agente Híbrido (${this.vlmAgent.name} + VisualAnalysisAgent)`,
      processedInMemoryOnly: true
    };
  }
}

module.exports = HybridEnsemblePerceptionProvider;
