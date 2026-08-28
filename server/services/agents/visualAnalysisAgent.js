/**
 * AGENTE 1: AGENTE DE ANÁLISE VISUAL DE PIXELS E CARACTERÍSTICAS
 * Processa métricas dos pixels extraídos da imagem em memória RAM
 * para identificar pessoas, fones de ouvido, roupas, objetos e iluminação.
 */
class VisualAnalysisAgent {
  /**
   * Analisa métricas de imagem e características visuais do cliente.
   * 
   * @param {Object} params
   * @param {Object} [params.visualFeatures] Métricas extraídas dos pixels no cliente (PWA)
   * @param {Buffer} [params.imageBuffer] Buffer de imagem em RAM
   * @returns {Object} Análise estruturada de elementos básicos
   */
  static analyzeImageFeatures({ visualFeatures, imageBuffer }) {
    // Se o cliente PWA enviou métricas visuais reais extraídas dos pixels da câmera:
    const features = visualFeatures || {};
    const skinRatio = typeof features.skinRatio === 'number' ? features.skinRatio : 0;
    const edgeDensity = typeof features.edgeDensity === 'number' ? features.edgeDensity : 0;
    const dominantColors = Array.isArray(features.dominantColors) ? features.dominantColors : [];
    const brightness = typeof features.brightness === 'number' ? features.brightness : 128;

    // Detecção dinâmica de Ser Humano baseada na proporção real de pixels de tom de pele e silhueta
    const hasHuman = Boolean(features.hasFaceCandidate || skinRatio > 0.08);

    // Detecção de Acessórios (Fones de ouvido, óculos)
    const hasHeadphones = Boolean(features.headphoneCandidate && skinRatio > 0.05);
    const hasGlasses = Boolean(features.glassesCandidate);

    // Análise de Vestuário pelas cores dominantes reais extraídas
    const clothingColor = dominantColors[0] || null;

    const detectedObjects = [];
    if (hasHuman) {
      detectedObjects.push('Ser Humano / Pessoa');
      if (clothingColor) {
        detectedObjects.push(`Vestuário (Tom ${clothingColor})`);
      }
    }
    if (hasHeadphones) {
      detectedObjects.push('Fone de ouvido (Headphones)');
    }
    if (hasGlasses) {
      detectedObjects.push('Óculos');
    }

    const lightingLevel = brightness > 180 ? 'Muito iluminado' : brightness > 80 ? 'Iluminação adequada' : 'Ambiente escuro';
    detectedObjects.push(`Iluminação: ${lightingLevel}`);

    // Cálculo heurístico determinístico de profundidade/distância
    // Quanto maior a densidade de bordas no quadrante inferior e a taxa de proporção da pessoa/objeto, menor a distância em metros.
    let estimatedMeters = 1.8;
    if (skinRatio > 0.25 || edgeDensity > 0.45) {
      estimatedMeters = 0.4;
    } else if (skinRatio > 0.12 || edgeDensity > 0.28) {
      estimatedMeters = 0.8;
    } else if (skinRatio > 0.05 || edgeDensity > 0.15) {
      estimatedMeters = 1.4;
    } else {
      estimatedMeters = 2.5;
    }
    const proximityLabel = `${estimatedMeters.toString().replace('.', ',')} m`;

    return {
      humanDetected: hasHuman,
      skinRatioPercent: Math.round(skinRatio * 100),
      detectedObjects: detectedObjects,
      clothingColor: clothingColor || 'não identificado',
      hasHeadphones: hasHeadphones,
      lightingLevel: lightingLevel,
      estimatedDistanceMeters: estimatedMeters,
      proximityEstimate: proximityLabel,
      confidence: hasHuman ? 0.88 : 0.95
    };
  }
}

module.exports = VisualAnalysisAgent;
