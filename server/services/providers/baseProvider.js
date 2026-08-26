/**
 * Class Abstrata / Interface Base para Provedores de Percepção Ambiental.
 * Define o contrato padrão que todas as implementações concretas de IA devem seguir.
 */
class BasePerceptionProvider {
  constructor(name) {
    if (new.target === BasePerceptionProvider) {
      throw new TypeError("Não é possível instanciar a classe abstrata BasePerceptionProvider diretamente.");
    }
    this.name = name;
  }

  /**
   * Processa imagem e/ou áudio em memória volátil e retorna a análise de percepção.
   * Prioriza a detecção de obstáculos e perigos físicos no ambiente.
   * 
   * @param {Object} params
   * @param {Buffer} [params.imageBuffer] Buffer da imagem em memória RAM
   * @param {string} [params.imageMimeType] Tipo MIME da imagem
   * @param {Buffer} [params.audioBuffer] Buffer do áudio de pergunta em memória RAM
   * @param {string} [params.userQuestion] Pergunta opcional enviada pelo usuário
   * @returns {Promise<{ description: string, hazards: string[], speechText: string, priority: 'HIGH'|'NORMAL' }>}
   */
  async analyzePerception({ imageBuffer, imageMimeType, audioBuffer, userQuestion }) {
    throw new Error("O método analyzePerception() deve ser implementado pela subclasse.");
  }
}

module.exports = BasePerceptionProvider;
