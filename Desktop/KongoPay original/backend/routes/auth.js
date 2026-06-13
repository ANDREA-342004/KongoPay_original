const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

module.exports = router;