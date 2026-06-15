const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifierToken = (req, res, next) => {
  // Récupérer le token dans le header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Si pas de token
  if (!token) {
    return res.status(401).json({ 
      error: '❌ Accès refusé - Token manquant !' 
    });
  }

  // Vérifier le token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: '❌ Token invalide ou expiré !' 
      });
    }
    req.user = user;
    next();
  });
};

module.exports = verifierToken;