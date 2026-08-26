const multer = require('multer');

/**
 * Middleware Multer configurado estritamente para retenção zero de dados.
 * Utiliza exclusivamente `memoryStorage()`, garantindo que os arquivos de mídia
 * permaneçam em memória RAM (Buffers) e NUNCA sejam salvos no sistema de arquivos.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp3',
    'audio/mpeg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Formato de mídia não suportado: ${file.mimetype}. Envie apenas imagens ou áudios válidos.`), false);
  }
};

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024, // Limite para evitar abuso de memória (OOM/DoS)
    files: 2 // No máximo 1 imagem + 1 áudio por requisição
  },
  fileFilter: fileFilter
});

module.exports = upload;
