const MockPerceptionProvider = require('../services/providers/mockProvider');
const GeminiPerceptionProvider = require('../services/providers/geminiProvider');
const OpenAIPerceptionProvider = require('../services/providers/openaiProvider');
const HybridEnsemblePerceptionProvider = require('../services/providers/hybridEnsembleProvider');

/**
 * Design Pattern: FACTORY PATTERN (Fábrica de Serviços de IA e Agentes)
 * 
 * Responsável pela criação e gerenciamento dinâmico da Arquitetura Multi-Agente Híbrida.
 * Permite instanciar o pipeline de agentes múltiplos ('multi-agent', 'hybrid') ou provedores individuais ('gemini', 'openai', 'mock').
 */
class AIServiceFactory {
  /**
   * Instancia o pipeline de agentes ou provedor específico.
   * 
   * @param {string} [providerType] Opcional. 'multi-agent', 'hybrid', 'mock', 'gemini', 'openai', 'gpt'
   * @returns {import('../services/providers/baseProvider')} Instância do Provedor Concreto ou Multi-Agente
   */
  static createProvider(providerType) {
    const selected = (providerType || process.env.AI_PROVIDER || 'hybrid').toLowerCase();

    switch (selected) {
      case 'gemini':
        return new GeminiPerceptionProvider(process.env.GEMINI_API_KEY);

      case 'openai':
      case 'gpt':
      case 'gpt-4o':
      case 'gpt-4o-mini':
        return new OpenAIPerceptionProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL);

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
