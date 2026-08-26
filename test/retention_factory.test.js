const test = require('node:test');
const assert = require('node:assert');

const AIServiceFactory = require('../server/patterns/aiServiceFactory');
const EphemeralMediaProcessor = require('../server/services/ephemeralProcessor');
const VisualAnalysisAgent = require('../server/services/agents/visualAnalysisAgent');

test('AIServiceFactory - deve instanciar MultiAgentHybridEnsembleProvider por padrão', () => {
  const provider = AIServiceFactory.createProvider('multi-agent');
  assert.strictEqual(provider.name, 'MultiAgentHybridEnsembleProvider');
});

test('AIServiceFactory - deve instanciar GeminiPerceptionProvider quando solicitado', () => {
  const provider = AIServiceFactory.createProvider('gemini');
  assert.strictEqual(provider.name, 'GeminiPerceptionProvider');
});

test('VisualAnalysisAgent - deve extrair características visuais de fones, roupas e pessoas', () => {
  const mockFeatures = {
    skinRatio: 0.12,
    hasFaceCandidate: true,
    headphoneCandidate: true,
    edgeDensity: 0.22,
    brightness: 140,
    dominantColors: ['azul escuro']
  };

  const analysis = VisualAnalysisAgent.analyzeImageFeatures({ visualFeatures: mockFeatures });
  
  assert.strictEqual(analysis.humanDetected, true);
  assert.strictEqual(analysis.hasHeadphones, true);
  assert.strictEqual(analysis.clothingColor, 'azul escuro');
});

test('EphemeralMediaProcessor - deve responder à pergunta "O que tem na minha frente" sem alerta indevido', async () => {
  const mockImageFile = {
    buffer: Buffer.from('imagem_com_pessoa_e_fone'),
    mimetype: 'image/jpeg'
  };

  const result = await EphemeralMediaProcessor.processPerception({
    imageFile: mockImageFile,
    userQuestion: 'O que tem na minha frente?',
    visualFeatures: { skinRatio: 0.15, headphoneCandidate: true, dominantColors: ['azul'] },
    providerOverride: 'multi-agent'
  });

  assert.strictEqual(result.priority, 'NORMAL'); // Deve ser NORMAL, sem caixa vermelha de alarme
  assert.ok(result.speechText.includes('À sua frente'));
  assert.strictEqual(result.retentionPolicy.zeroDataRetention, true);
  assert.strictEqual(mockImageFile.buffer, null);
});
