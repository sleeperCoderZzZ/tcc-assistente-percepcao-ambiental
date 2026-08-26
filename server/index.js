const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const memoryUpload = require('./middleware/memoryUpload');
const EphemeralMediaProcessor = require('./services/ephemeralProcessor');
const AIServiceFactory = require('./patterns/aiServiceFactory');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de Middlewares Básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do cliente PWA
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Healthcheck e Métricas de Uso de Memória RAM em Tempo Real
 */
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'online',
    architecture: 'Zero Data Retention Multi-Agent Pipeline',
    pattern: 'Factory Pattern + Multi-Agent Ensemble',
    activeProvider: process.env.AI_PROVIDER || 'multi-agent',
    memoryUsageMB: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Rota Principal de Percepção Ambiental Multi-Agente
 */
app.post('/api/perceive', memoryUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files || {};
    const imageFile = files.image ? files.image[0] : null;
    const audioFile = files.audio ? files.audio[0] : null;
    const userQuestion = req.body.question || req.body.text || '';
    const providerOverride = req.body.provider;

    let visualFeatures = null;
    if (req.body.visualFeatures) {
      try {
        visualFeatures = typeof req.body.visualFeatures === 'string' 
          ? JSON.parse(req.body.visualFeatures) 
          : req.body.visualFeatures;
      } catch (e) {
        visualFeatures = null;
      }
    }

    if (!imageFile && !audioFile && !userQuestion) {
      return res.status(400).json({
        error: 'Requisição inválida. Envie pelo menos uma imagem ou pergunta de voz para percepção ambiental.'
      });
    }

    // Processamento Efêmero em Memória com Retenção Zero no Pipeline Multi-Agente
    const perceptionResult = await EphemeralMediaProcessor.processPerception({
      imageFile,
      audioFile,
      userQuestion,
      visualFeatures,
      providerOverride
    });

    return res.json({
      success: true,
      data: perceptionResult
    });

  } catch (error) {
    console.error('[ERRO PERCEPÇÃO AMBIENTAL MULTI-AGENTE]:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao processar a percepção ambiental em memória.'
    });
  }
});

// Middleware de tratamento de erros do Multer / Upload
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Erro de validação no envio da mídia.'
    });
  }
  next();
});

// Rota Fallback para PWA SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicialização do Servidor
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` ASSISTENTE DE PERCEPÇÃO AMBIENTAL - PIPELINE MULTI-AGENTE `);
    console.log(`================================================================`);
    console.log(` Servidor rodando na porta: http://localhost:${PORT}`);
    console.log(` Provedor de IA Ativo: Multi-Agent Hybrid Ensemble Pipeline`);
    console.log(` Armazenamento Mídia: MEMÓRIA VOLÁTIL (multer.memoryStorage)`);
    console.log(`================================================================`);
  });
}

module.exports = app;
