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

  async analyzePerception({ imageBuffer, imageMimeType, userQuestion }) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const bufferSizeKB = imageBuffer ? Math.round(imageBuffer.length / 1024) : 0;
    const questionText = userQuestion ? userQuestion.toLowerCase() : '';

    // Pergunta explícita sobre o que está à frente
    const isGeneralQuestion = questionText.includes('frente') || 
                               questionText.includes('o que') || 
                               questionText.includes('ve') || 
                               questionText.includes('olha') ||
                               !userQuestion;

    if (isGeneralQuestion) {
      return {
        priority: 'NORMAL',
        humanDetected: true,
        humanDetails: 'Uma pessoa física em pé, usando roupa azul e fones de ouvido.',
        proximityEstimate: '0,7 metro (70 cm da câmera)',
        hazards: [], // Sem perigos de emergência
        description: `À sua frente há uma pessoa vestindo roupa azul e fones de ouvido, posicionada a aproximadamente 70 cm de distância. O ambiente está bem iluminado e sem obstáculos no chão.`,
        speechText: `À sua frente há uma pessoa vestindo roupa azul e fones de ouvido, a cerca de 70 centímetros de distância. O caminho está seguro.`,
        provider: this.name,
        processedInMemoryOnly: true
      };
    }

    // Caso pergunto especificamente por perigos/obstáculos perigosos
    if (questionText.includes('perigo') || questionText.includes('degrau') || questionText.includes('buraco')) {
      return {
        priority: 'HIGH',
        humanDetected: false,
        humanDetails: null,
        proximityEstimate: '1,2 metro',
        hazards: ['Degrau de 15cm à frente.'],
        description: 'Atenção: Degrau de 15 centímetros identificado no piso a 1,2 metro.',
        speechText: 'Cuidado! Há um degrau no chão a um metro e vinte centímetros de distância.',
        provider: this.name,
        processedInMemoryOnly: true
      };
    }

    return {
      priority: 'NORMAL',
      humanDetected: true,
      humanDetails: 'Pessoa física identificada à frente.',
      proximityEstimate: '0,8 metro',
      hazards: [],
      description: `Resposta à pergunta "${userQuestion}": À sua frente há uma pessoa a cerca de 80 cm de distância.`,
      speechText: `Respondendo à sua pergunta: à sua frente há uma pessoa posicionada a cerca de 80 centímetros.`,
      provider: this.name,
      processedInMemoryOnly: true
    };
  }
}

module.exports = MockPerceptionProvider;
