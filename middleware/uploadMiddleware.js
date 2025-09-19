const multer = require('multer');
const path = require('path');

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/')); // Pasta onde as imagens serão salvas
  },
  filename: function (req, file, cb) {
    // Gera um nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitiza o nome do arquivo
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const ext = path.extname(sanitizedFilename);
    cb(null, `gym-${uniqueSuffix}${ext}`);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  console.log('Processando arquivo:', file);
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo inválido. Aceitos: ${allowedMimes.join(', ')}`));
  }
};

// Configuração do multer com tratamento de erro
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
    files: 1 // Apenas um arquivo por vez
  }
}).single('image'); // Configura para um único arquivo com o campo 'image'

// Wrapper para tratamento de erros do multer
module.exports = (req, res, next) => {
  // Se não houver arquivo sendo enviado, pula o processamento do multer
  if (!req.is('multipart/form-data')) {
    console.log('Requisição sem arquivo, pulando multer');
    return next();
  }

  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.error('Erro Multer:', err);
      return res.status(400).json({
        message: 'Erro no upload do arquivo',
        error: err.message
      });
    } else if (err) {
      console.error('Erro desconhecido:', err);
      return res.status(500).json({
        message: 'Erro ao processar upload',
        error: err.message
      });
    }

    console.log('Upload processado com sucesso');
    console.log('Body após upload:', req.body);
    console.log('Arquivo:', req.file);

    next();
  });
};

module.exports = upload;