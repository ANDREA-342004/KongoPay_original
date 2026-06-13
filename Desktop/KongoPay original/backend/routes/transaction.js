const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ENVOYER DE L'ARGENT
router.post('/send', async (req, res) => {
  const { wallet_emetteur, wallet_recepteur, montant } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verrouiller le wallet émetteur
    const walletCheck = await client.query(
      'SELECT solde FROM wallets WHERE id = $1 FOR UPDATE',
      [wallet_emetteur]
    );

    const solde = walletCheck.rows[0].solde;

    // Vérifier le solde
    if (solde < montant) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '❌ Solde insuffisant' });
    }

    // Débiter l'émetteur
    await client.query(
      'UPDATE wallets SET solde = solde - $1 WHERE id = $2',
      [montant, wallet_emetteur]
    );

    // Créditer le récepteur
    await client.query(
      'UPDATE wallets SET solde = solde + $1 WHERE id = $2',
      [montant, wallet_recepteur]
    );

    // Enregistrer dans le ledger
    await client.query(
      `INSERT INTO transactions 
       (wallet_emetteur, wallet_recepteur, montant, statut)
       VALUES ($1, $2, $3, 'validee')`,
      [wallet_emetteur, wallet_recepteur, montant]
    );

    await client.query('COMMIT');
    res.json({ message: '✅ Transaction réussie !' });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// VOIR LES TRANSACTIONS
router.get('/:wallet_id', async (req, res) => {
  const { wallet_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE wallet_emetteur = $1 OR wallet_recepteur = $1
       ORDER BY created_at DESC`,
      [wallet_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;