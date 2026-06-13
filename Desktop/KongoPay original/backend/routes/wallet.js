const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// CRÉER UN WALLET
router.post('/create', async (req, res) => {
  const { utilisateur_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO wallets (utilisateur_id, solde, devise) 
       VALUES ($1, 0, 'FCFA') RETURNING *`,
      [utilisateur_id]
    );
    res.status(201).json({ 
      message: '✅ Wallet créé !', 
      wallet: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VOIR LE SOLDE
router.get('/:id/balance', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT solde, devise FROM wallets WHERE id = $1',
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