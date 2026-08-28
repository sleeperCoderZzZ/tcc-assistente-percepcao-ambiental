const BasePerceptionProvider = require('./baseProvider');

/**
 * Provedor Mock de Percepção Ambiental Aprimorado.
 * Responde diretamente à pergunta feita pelo usuário em linguagem natural fluida,
 * reservando alertas vermelhos de segurança exclusivamente para perigos físicos reais.
 */
class MockPerceptionProvider extends BasePerceptionProvider {
  constructor() {
    super('MockPerceptionProvider');
  }

  async analyzePerception({ imageBuffer, imageMimeType, userQuestion, visualFeatures }) {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const features = visualFeatures || {};
    const questionText = userQuestion ? userQuestion.toLowerCase() : '';
    const hasHuman = Boolean(features.hasFaceCandidate || (features.skinRatio && features.skinRatio > 0.08));
    const clothingColor = features.clothingColor || (features.dominantColors && features.dominantColors[0]) || null;
    const hasHeadphones = Boolean(features.headphoneCandidate);

    const detectedObjects = [];
    if (hasHuman) {
      detectedObjects.push('Ser Humano / Pessoa');
      if (clothingColor) detectedObjects.push(`Vestuário (${clothingColor})`);
    } else {
      detectedObjects.push('Caminho livre / Espaço aberto');
    }
    if (hasHeadphones) detectedObjects.push('Fone de ouvido');
    detectedObjects.push('Iluminação de ambiente');

    const isHazardQuestion = questionText.includes('perigo') || questionText.includes('degrau') || questionText.includes('buraco');

    if (isHazardQuestion) {
      return {
        priority: 'HIGH',
        humanDetected: false,
        humanDetails: null,
        proximityEstimate: '1,2 metro',
        detectedObjects: ['Degrau no piso', 'Superfície irregular'],
        hazards: ['Degrau de 15cm à frente.'],
        description: 'Atenção: Degrau de 15 centímetros identificado no piso a 1,2 metro.',
        speechText: 'Cuidado! Há um degrau no chão a um metro e vinte centímetros de distância.',
        provider: this.name,
        processedInMemoryOnly: true
      };
    }

    if (hasHuman) {
      return {
        priority: 'NORMAL',
        humanDetected: true,
        humanDetails: `Pessoa identificada à frente${clothingColor ? ' vestindo ' + clothingColor : ''}.`,
        proximityEstimate: '0,9 metro',
        detectedObjects: detectedObjects,
        hazards: [],
        description: `À sua frente há uma pessoa identificada pela câmera${clothingColor ? ' vestindo roupa de tom ' + clothingColor : ''}${hasHeadphones ? ' com fone de ouvido' : ''}, a cerca de 90 cm de distância.`,
        speechText: `À sua frente há uma pessoa a cerca de 90 centímetros de distância.`,
        provider: this.name,
        processedInMemoryOnly: true
      };
    }

    return {
      priority: 'NORMAL',
      humanDetected: false,
      humanDetails: null,
      proximityEstimate: 'Desobstruído',
      detectedObjects: ['Ambiente interno', 'Chão nivelado', 'Iluminação adequada'],
      hazards: [],
      description: `O ambiente à frente está livre de obstáculos imediatos. Nenhuma pessoa ou perigo detectado na área central.`,
      speechText: `À sua frente o caminho está livre de obstáculos.`,
      provider: this.name,
      processedInMemoryOnly: true
    };
  }
}

module.exports = MockPerceptionProvider;
