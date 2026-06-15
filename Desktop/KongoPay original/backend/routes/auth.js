const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifierToken = require('../middleware/auth');
// REGISTER
router.post('/register', async (req, res) => {
  const { nom, telephone, pin } = req.body;
  try {
    const hashedPin = await bcrypt.hash(pin, 10);
    const result = await pool.query(
      `INSERT INTO utilisateur (nom, telephone, hash_pin) 
       VALUES ($1, $2, $3) RETURNING *`,
      [nom, telephone, hashedPin]
    );
    res.status(201).json({ 
      message: '✅ Compte créé !', 
      user: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { telephone, pin } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM utilisateur WHERE telephone = $1',
      [telephone]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const user = result.rows[0];
    const validPin = await bcrypt.compare(pin, user.hash_pin);
    if (!validPin)
      return res.status(401).json({ error: 'PIN incorrect' });

    const token = jwt.sign(
      { id: user.id, telephone: user.telephone },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ message: '✅ Connecté !', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ROUTE COMPLIANCE (superviseurs uniquement)
router.get('/compliance/investigations', verifierToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.id_transaction,
        t.nom,
        t.montant,
        t.motif_transaction,
        t.date_transaction,
        t.annuler,
        t.memoire_double_depot,
        w1.nom as wallet_source_nom,
        w2.nom as wallet_destination_nom
       FROM transaction t
       JOIN wallet w1 ON t.wallet_source = w1.id_wallet
       JOIN wallet w2 ON t.wallet_destination = w2.id_wallet
       ORDER BY t.date_transaction DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;