const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log('🔐 Auth Header:', authHeader ? 'Presente' : 'Ausente');
  
  const token = authHeader?.split(" ")[1];
  console.log('🔑 Token extraído:', token ? 'SIM' : 'NÃO');
  
  if (!token) {
    console.log('❌ Token não fornecido');
    return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido. User:', decoded);
    req.user = decoded; // Adiciona o usuário decodificado à requisição
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error.message);
    res.status(400).json({ message: "Token inválido ou expirado." });
  }
};