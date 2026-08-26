const MockPerceptionProvider = require('../services/providers/mockProvider');
const GeminiPerceptionProvider = require('../services/providers/geminiProvider');
const HybridEnsemblePerceptionProvider = require('../services/providers/hybridEnsembleProvider');

/**
 * Design Pattern: FACTORY PATTERN (Fábrica de Serviços de IA e Agentes)
 * 
 * Responsável pela criação e gerenciamento dinâmico da Arquitetura Multi-Agente Híbrida.
 * Permite instanciar o pipeline de agentes múltiplos ('multi-agent', 'hybrid') ou provedores individuais.
 */
class AIServiceFactory {
  /**
   * Instancia o pipeline de agentes ou provedor específico.
   * 
   * @param {string} [providerType] Opcional. 'multi-agent', 'hybrid', 'mock', 'gemini'
   * @returns {import('../services/providers/baseProvider')} Instância do Provedor Concreto ou Multi-Agente
   */
  static createProvider(providerType) {
    const selected = (providerType || process.env.AI_PROVIDER || 'hybrid').toLowerCase();

    switch (selected) {
      case 'gemini':
        return new GeminiPerceptionProvider(process.env.GEMINI_API_KEY);

      case 'mock':
        return new MockPerceptionProvider();

      case 'hybrid':
      case 'multi-agent':
      default:
        return new HybridEnsemblePerceptionProvider(process.env.AI_PROVIDER);
    }
  }
}

module.exports = AIServiceFactory;
