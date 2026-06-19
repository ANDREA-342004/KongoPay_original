const API = 'http://localhost:3000/api';
const token = localStorage.getItem('kp_token');
let TRANSACTIONS = [];
let currentTx = null;
let survList = JSON.parse(localStorage.getItem('kp_surveillance') || '[]');

const statutBadge = {
  valide: '<span class="badge badge-vert">Validée</span>',
  suspect: '<span class="badge badge-rouge">Suspecte</span>',
  en_cours: '<span class="badge badge-bleu">En cours</span>'
};

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function amountFmt(value) {
  return Number(value || 0).toLocaleString('fr-FR') + ' FCFA';
}

async function chargerTransactions() {
  const tbody = document.getElementById('txTable');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--txt-mute)">⏳ Chargement…</td></tr>';
  
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  try {
    const res = await fetch(`${API}/auth/compliance/investigations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.status === 401 || res.status === 403) {
      showToast('❌ Accès refusé — reconnectez-vous');
      setTimeout(() => window.location.href = 'index.html', 1500);
      return;
    }
    
    const data = await res.json();
    TRANSACTIONS = Array.isArray(data) ? data : [];
    document.getElementById('kpi-total').textContent = TRANSACTIONS.length;
    document.getElementById('kpi-suspects').textContent = TRANSACTIONS.filter(tx => tx.annuler === true).length;
    const volume = TRANSACTIONS.reduce((sum, tx) => sum + Number(tx.montant || 0), 0);
    document.getElementById('kpi-volume').textContent = (volume / 1000000).toFixed(1) + 'M';
    document.getElementById('kpi-surv').textContent = survList.length;
    renderTable('tout');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--rouge)">❌ Erreur : ${err.message}</td></tr>`;
  }
}

function renderTable(filter) {
  const rows = filter === 'tout'
    ? TRANSACTIONS
    : filter === 'suspect'
      ? TRANSACTIONS.filter(tx => tx.annuler === true || tx.memoire_double_depot === true)
      : TRANSACTIONS.filter(tx => tx.annuler === false);
  
  const tbody = document.getElementById('txTable');
  if (!tbody) return;
  
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--txt-mute)">Aucune transaction trouvée</td></tr>';
    return;
  }
  
  tbody.innerHTML = rows.map((tx, idx) => {
    const estSuspect = tx.annuler === true || tx.memoire_double_depot === true;
    const statut = estSuspect ? 'suspect' : tx.annuler === false ? 'valide' : 'en_cours';
    const walletSrc = tx.wallet_source_nom || tx.wallet_source || '—';
    const walletDst = tx.wallet_destination_nom || tx.wallet_destination || '—';
    
    return `
      <tr class="table-row" data-index="${idx}">
        <td class="tx-id">${tx.id_transaction || '—'}</td>
        <td>
          <div class="tx-desc">${tx.motif_transaction || tx.nom || '—'}</div>
          <div class="tx-wallet">${walletSrc} → ${walletDst}</div>
        </td>
        <td><span class="amount debit">${amountFmt(tx.montant)}</span></td>
        <td>${statutBadge[statut] || statutBadge.en_cours}</td>
        <td>${estSuspect ? '<span style="color:var(--rouge);font-size:.72rem;font-weight:700;">⚠️ Double dépôt</span>' : '<span class="profile-dot dot-standard"></span>Standard'}</td>
        <td>
          <button class="action-btn btn-valider" data-action="valider" data-index="${idx}">✔</button>
          <button class="action-btn btn-bloquer" data-action="bloquer" data-index="${idx}">🚩</button>
        </td>
      </tr>`;
  }).join('');
  
  attachTableEvents();
}

function attachTableEvents() {
  document.querySelectorAll('#txTable tr.table-row').forEach(row => {
    row.addEventListener('click', () => openModal(Number(row.dataset.index)));
  });
  
  document.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      const idx = Number(btn.dataset.index);
      if (btn.dataset.action === 'valider') quickAction('valider', idx);
      if (btn.dataset.action === 'bloquer') flagSurv(idx);
    });
  });
}

function filterTx(filter, button) {
  document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.toggle('active', tab === button));
  renderTable(filter);
}

function openModal(index) {
  const tx = TRANSACTIONS[index];
  if (!tx) return;
  
  currentTx = { ...tx, index };
  const estSuspect = tx.annuler === true || tx.memoire_double_depot === true;
  const statut = estSuspect ? 'suspect' : 'valide';
  
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-row"><span>ID Transaction</span><span>${tx.id_transaction || '—'}</span></div>
    <div class="modal-row"><span>Motif</span><span>${tx.motif_transaction || tx.nom || '—'}</span></div>
    <div class="modal-row"><span>Wallet Source</span><span>${tx.wallet_source_nom || tx.wallet_source || '—'}</span></div>
    <div class="modal-row"><span>Wallet Destination</span><span>${tx.wallet_destination_nom || tx.wallet_destination || '—'}</span></div>
    <div class="modal-row"><span>Montant</span><span class="amount debit">${amountFmt(tx.montant)}</span></div>
    <div class="modal-row"><span>Date</span><span>${tx.date_transaction ? new Date(tx.date_transaction).toLocaleString('fr-FR') : '—'}</span></div>
    <div class="modal-row"><span>Statut</span><span>${statutBadge[statut] || statutBadge.en_cours}</span></div>
    <div class="modal-row"><span>Double dépôt</span><span>${estSuspect ? '⚠️ Oui' : '✅ Non'}</span></div>
  `;
  
  document.getElementById('modalBg').classList.add('open');
}

function closeModal(event) {
  if (event.target === document.getElementById('modalBg')) {
    document.getElementById('modalBg').classList.remove('open');
  }
}

function validerTx() {
  document.getElementById('modalBg').classList.remove('open');
  if (currentTx) showToast('✅ Transaction ' + (currentTx.id_transaction || '') + ' validée');
}

function bloquerTx() {
  document.getElementById('modalBg').classList.remove('open');
  if (currentTx) flagSurv(currentTx.index);
}

function quickAction(action, index) {
  const tx = TRANSACTIONS[index];
  if (!tx) return;
  showToast(action === 'valider'
    ? '✅ Validé : ' + (tx.id_transaction || '')
    : '🔒 Bloqué : ' + (tx.wallet_source_nom || tx.wallet_source || '—'));
}

function flagSurv(index) {
  const tx = TRANSACTIONS[index];
  if (!tx) return;
  
  const wallet = tx.wallet_source_nom || String(tx.wallet_source) || '—';
  if (!survList.find(item => item.wallet === wallet)) {
    survList.push({ wallet, nom: tx.motif_transaction || tx.nom || '—', added: new Date().toISOString() });
    localStorage.setItem('kp_surveillance', JSON.stringify(survList));
    renderSurv();
    showToast('🚩 ' + wallet + ' ajouté à la surveillance');
    document.getElementById('kpi-surv').textContent = survList.length;
  } else {
    showToast('⚠️ Déjà sous surveillance');
  }
}

function removeSurv(index) {
  survList.splice(index, 1);
  localStorage.setItem('kp_surveillance', JSON.stringify(survList));
  renderSurv();
  document.getElementById('kpi-surv').textContent = survList.length;
}

function renderSurv() {
  const list = document.getElementById('survList');
  if (!list) return;
  
  document.getElementById('surv-count').textContent = survList.length + ' compte(s)';
  
  if (!survList.length) {
    list.innerHTML = '<p style="font-size:.8rem;color:var(--txt-mute);padding:.5rem .75rem;">Aucun compte marqué.</p>';
    return;
  }
  
  list.innerHTML = survList.map((item, idx) => `
    <div class="surv-item">
      <div>
        <div class="surv-id">${item.wallet}</div>
        <div class="surv-name">${item.nom}</div>
      </div>
      <span class="surv-flag" data-index="${idx}">✕</span>
    </div>
  `).join('');
  
  document.querySelectorAll('.surv-flag').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      removeSurv(Number(btn.dataset.index));
    });
  });
}

function updateClock() {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function initDashboard() {
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  document.querySelectorAll('.filter-tab').forEach(button => {
    button.addEventListener('click', () => filterTx(button.dataset.filter, button));
  });
  
  document.getElementById('modalBg').addEventListener('click', closeModal);
  document.getElementById('modalClose').addEventListener('click', () => document.getElementById('modalBg').classList.remove('open'));
  document.getElementById('modalValidate').addEventListener('click', validerTx);
  document.getElementById('modalBlock').addEventListener('click', bloquerTx);
  
  renderSurv();
  updateClock();
  setInterval(updateClock, 1000);
  chargerTransactions();
}

document.addEventListener('DOMContentLoaded', initDashboard);
