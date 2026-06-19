const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('1234', 10);
  await pool.query(
    'INSERT INTO utilisateur (nom, telephone, hash_pin) VALUES ($1, $2, $3)',
    ['Test Client', '0700000002', hash]
  );
  console.log('OK ! Utilisateur cree');
  process.exit();
}

main().catch(e => {
  console.log(e.message);
  process.exit();
});