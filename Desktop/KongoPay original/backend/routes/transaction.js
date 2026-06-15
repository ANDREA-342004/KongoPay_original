const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifierToken = require('../middleware/auth');

// ENVOYER DE L'ARGENT (protégé)
router.post('/send', verifierToken, async (req, res) => {
  const { wallet_source, wallet_destination, montant } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verrouiller le wallet source
    const walletCheck = await client.query(
      'SELECT solde FROM wallet WHERE id_wallet = $1 FOR UPDATE',
      [wallet_source]
    );

    if (walletCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Wallet source non trouvé' });
    }

    const solde = walletCheck.rows[0].solde;

    // Vérifier le solde
    if (solde < montant) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '❌ Solde insuffisant' });
    }

    // Débiter le source
    await client.query(
      'UPDATE wallet SET solde = solde - $1 WHERE id_wallet = $2',
      [montant, wallet_source]
    );

    // Créditer la destination
    await client.query(
      'UPDATE wallet SET solde = solde + $1 WHERE id_wallet = $2',
      [montant, wallet_destination]
    );

    // Enregistrer la transaction
    await client.query(
      `INSERT INTO transaction 
       (nom, montant, motif_transaction, wallet_source, wallet_destination)
       VALUES ($1, $2, $3, $4, $5)`,
      [`Transfert ${montant} FCFA`, montant, 'transfert', wallet_source, wallet_destination]
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

// VOIR LES TRANSACTIONS (protégé)
router.get('/:wallet_id', verifierToken, async (req, res) => {
  const { wallet_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM transaction 
       WHERE wallet_source = $1 OR wallet_destination = $1
       ORDER BY date_transaction DESC`,
      [wallet_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;