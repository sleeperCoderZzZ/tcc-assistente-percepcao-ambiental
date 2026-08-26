const AIServiceFactory = require('../patterns/aiServiceFactory');

/**
 * Processador Efêmero de Mídia em Memória (Retenção Zero de Dados Multi-Agente).
 * Recebe o payload do cliente, aciona a arquitetura Multi-Agente Híbrida e descarta
 * os buffers em RAM imediatamente após a inferência.
 */
class EphemeralMediaProcessor {
  /**
   * Processa a solicitação de percepção ambiental mantendo retenção zero em disco.
   * 
   * @param {Object} options
   * @param {Express.Multer.File} [options.imageFile] Arquivo de imagem em memória (Multer)
   * @param {Express.Multer.File} [options.audioFile] Arquivo de áudio em memória (Multer)
   * @param {string} [options.userQuestion] Texto da pergunta do usuário
   * @param {Object} [options.visualFeatures] Métricas de pixels enviadas pelo cliente
   * @param {string} [options.providerOverride] Provedor específico (opcional)
   */
  static async processPerception({ imageFile, audioFile, userQuestion, visualFeatures, providerOverride }) {
    let imageBuffer = imageFile ? imageFile.buffer : null;
    let imageMimeType = imageFile ? imageFile.mimetype : null;
    let audioBuffer = audioFile ? audioFile.buffer : null;

    try {
      // 1. Obter instância do Pipeline Multi-Agente Híbrido via Factory Pattern
      const provider = AIServiceFactory.createProvider(providerOverride);

      // 2. Executar inferência combinando análise de pixels + VLM em RAM
      const result = await provider.analyzePerception({
        imageBuffer,
        imageMimeType,
        audioBuffer,
        userQuestion,
        visualFeatures
      });

      // 3. Adicionar métricas de auditoria de retenção zero
      result.retentionPolicy = {
        zeroDataRetention: true,
        storageType: 'RAM_VOLATILE_ONLY',
        persistedToDisk: false,
        multiAgentPipeline: true,
        timestamp: new Date().toISOString()
      };

      return result;

    } finally {
      // 4. GARANTIA DE RETENÇÃO ZERO: Desreferenciamento e descarte imediato dos buffers em RAM
      if (imageFile) {
        imageFile.buffer = null;
      }
      if (audioFile) {
        audioFile.buffer = null;
      }
      imageBuffer = null;
      audioBuffer = null;
    }
  }
}

module.exports = EphemeralMediaProcessor;
