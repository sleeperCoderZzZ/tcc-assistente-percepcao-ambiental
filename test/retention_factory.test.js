const test = require('node:test');
const assert = require('node:assert');

const AIServiceFactory = require('../server/patterns/aiServiceFactory');
const EphemeralMediaProcessor = require('../server/services/ephemeralProcessor');
const VisualAnalysisAgent = require('../server/services/agents/visualAnalysisAgent');
const BasePerceptionProvider = require('../server/services/providers/baseProvider');

test('AIServiceFactory - deve instanciar MultiAgentHybridEnsembleProvider por padrão', () => {
  const provider = AIServiceFactory.createProvider('multi-agent');
  assert.strictEqual(provider.name, 'MultiAgentHybridEnsembleProvider');
});

test('AIServiceFactory - deve instanciar GeminiPerceptionProvider quando solicitado', () => {
  const provider = AIServiceFactory.createProvider('gemini');
  assert.strictEqual(provider.name, 'GeminiPerceptionProvider');
  assert.ok(provider.preferredModel);
});

test('AIServiceFactory - deve instanciar MockPerceptionProvider quando solicitado', () => {
  const provider = AIServiceFactory.createProvider('mock');
  assert.strictEqual(provider.name, 'MockPerceptionProvider');
});

test('AIServiceFactory - deve instanciar OpenAIPerceptionProvider quando solicitado', () => {
  const provider = AIServiceFactory.createProvider('openai');
  assert.strictEqual(provider.name, 'OpenAIPerceptionProvider');
});

test('BasePerceptionProvider - deve lançar erro se instanciado diretamente (classe abstrata)', () => {
  assert.throws(() => {
    new BasePerceptionProvider('AbstractTest');
  }, TypeError);
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

  assert.strictEqual(result.priority, 'NORMAL');
  assert.ok(result.speechText.toLowerCase().includes('à sua frente'));
  assert.strictEqual(result.retentionPolicy.zeroDataRetention, true);
  assert.strictEqual(mockImageFile.buffer, null);
});

test('EphemeralMediaProcessor - GARANTIA ARQUITETURAL: deve limpar buffers da RAM mesmo se o provedor lançar erro', async () => {
  const mockImageFile = {
    buffer: Buffer.from('imagem_teste_erro'),
    mimetype: 'image/jpeg'
  };
  const mockAudioFile = {
    buffer: Buffer.from('audio_teste_erro'),
    mimetype: 'audio/wav'
  };

  // Mock de provedor que falha intencionalmente
  const failingProviderOverride = 'gemini';
  // Sem GEMINI_API_KEY no ambiente para forçar erro

  await assert.rejects(async () => {
    await EphemeralMediaProcessor.processPerception({
      imageFile: mockImageFile,
      audioFile: mockAudioFile,
      userQuestion: 'Pergunta com falha no provedor',
      providerOverride: failingProviderOverride
    });
  });

  // Validação estrita de retenção zero: buffers DEVEM ser nulos após o bloco finally
  assert.strictEqual(mockImageFile.buffer, null);
  assert.strictEqual(mockAudioFile.buffer, null);
});

test('EphemeralMediaProcessor - deve conter a estrutura de propriedades esperada pelo cliente PWA', async () => {
  const mockImageFile = {
    buffer: Buffer.from('imagem_teste_payload'),
    mimetype: 'image/jpeg'
  };

  const result = await EphemeralMediaProcessor.processPerception({
    imageFile: mockImageFile,
    userQuestion: 'Qual a cor da minha roupa?',
    providerOverride: 'mock'
  });

  assert.ok(typeof result.speechText === 'string');
  assert.ok(typeof result.description === 'string');
  assert.ok(Array.isArray(result.detectedObjects));
  assert.ok(typeof result.proximityEstimate === 'string');
  assert.ok(typeof result.humanDetected === 'boolean');
  assert.strictEqual(result.retentionPolicy.zeroDataRetention, true);
  assert.strictEqual(result.retentionPolicy.storageType, 'RAM_VOLATILE_ONLY');
});


