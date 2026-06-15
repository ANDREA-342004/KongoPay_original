const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifierToken = require('../middleware/auth');

// CRÉER UN WALLET (protégé)
router.post('/create', verifierToken, async (req, res) => {
  const { id_utilisateur } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO wallet (nom, solde, devise, id_utilisateur) 
       VALUES ($1, 0, 'FCFA', $2) RETURNING *`,
      [`Wallet ${id_utilisateur}`, id_utilisateur]
    );
    res.status(201).json({ 
      message: '✅ Wallet créé !', 
      wallet: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VOIR LE SOLDE (protégé)
router.get('/:id/balance', verifierToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT solde, devise FROM wallet WHERE id_wallet = $1',
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Wallet non trouvé' });
      
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;