const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Acesso negado. Token não fornecido." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adiciona o usuário decodificado à requisição
    next();
  } catch (error) {
    res.status(400).json({ message: "Token inválido ou expirado." });
  }
};