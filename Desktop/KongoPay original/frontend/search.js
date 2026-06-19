const API = 'http://localhost:3000/api';
const token = localStorage.getItem('kp_token');
let surv = JSON.parse(localStorage.getItem('kp_surveillance') || '[]');

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function saveSurv() {
  localStorage.setItem('kp_surveillance', JSON.stringify(surv));
}

function renderSurv() {
  const container = document.getElementById('survContainer');
  if (!container) return;
  document.getElementById('survCount').textContent = surv.length;
  if (!surv.length) {
    container.innerHTML = '<div class="empty-msg">Aucun compte marqué.</div>';
    return;
  }
  container.innerHTML = surv.map((item, idx) => `
    <div class="surv-item">
      <div>
        <div class="surv-id">${item.wallet}</div>
        <div class="surv-name">${item.nom}</div>
      </div>
      <span class="surv-remove" data-index="${idx}">✕</span>
    </div>
  `).join('');
  document.querySelectorAll('.surv-remove').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      const idx = Number(btn.dataset.index);
      surv.splice(idx, 1);
      saveSurv();
      renderSurv();
    });
  });
}

function amountFmt(value) {
  return Number(value || 0).toLocaleString('fr-FR') + ' FCFA';
}

async function chargerTransactions() {
  if (!token) {
    window.location.href = 'index.html';
    return [];
  }
  
  const walletId = document.getElementById('q-wallet').value.trim() || localStorage.getItem('kp_wallet_id') || '1';
  
  try {
    const res = await fetch(`${API}/transaction/${walletId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.status === 401 || res.status === 403) {
      showToast('❌ Session expirée — reconnectez-vous');
      setTimeout(() => window.location.href = 'index.html', 1500);
      return [];
    }
    
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    showToast('❌ Erreur : ' + err.message);
    return [];
  }
}

function renderResults(results) {
  const count = document.getElementById('resultsCount');
  const empty = document.getElementById('emptyState');
  const table = document.getElementById('resultsTable');
  const tbody = document.getElementById('resultsBody');
  
  if (!count || !empty || !table || !tbody) return;
  
  count.textContent = results.length;
  
  if (!results.length) {
    empty.innerHTML = '<div class="icon"><i class="fa-solid fa-magnifying-glass" style="color: rgb(6, 108, 22);"></i></div><p>Aucune transaction ne correspond à vos critères.</p>';
    empty.style.display = 'block';
    table.style.display = 'none';
    tbody.innerHTML = '';
    return;
  }
  
  empty.style.display = 'none';
  table.style.display = 'table';
  
  tbody.innerHTML = results.map((tx) => {
    const estSuspect = tx.annuler === true || tx.memoire_double_depot === true;
    const walletSrc = String(tx.wallet_source || '—');
    const walletDst = String(tx.wallet_destination || '—');
    const isSurv = surv.some(item => item.wallet === walletSrc);
    
    return `
      <tr class="${tx.memoire_double_depot ? 'highlighted' : ''}">
        <td class="tx-id">${tx.id_transaction || '—'}</td>
        <td>
          <div class="tx-desc">${tx.motif_transaction || tx.nom || '—'}</div>
          <div class="tx-wallet">${walletSrc} → ${walletDst}</div>
        </td>
        <td><span class="amount debit">-${amountFmt(tx.montant)}</span></td>
        <td>${estSuspect ? '<span class="badge badge-rouge">Suspecte</span>' : '<span class="badge badge-vert">Validée</span>'}</td>
        <td><span class="profile-dot dot-standard"></span>Standard</td>
        <td style="font-size:.78rem;">${tx.date_transaction ? new Date(tx.date_transaction).toLocaleDateString('fr-FR') : '—'}</td>
        <td>
          <button class="flag-btn ${isSurv ? 'flagged' : ''}" data-wallet="${walletSrc}" data-desc="${(tx.motif_transaction || tx.nom || '').replace(/"/g, '&quot;')}">${isSurv ? '🚩 Marqué' : '🚩'}</button>
        </td>
      </tr>`;
  }).join('');
  
  document.querySelectorAll('.flag-btn').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      const wallet = btn.dataset.wallet;
      const desc = btn.dataset.desc;
      
      if (!surv.some(item => item.wallet === wallet)) {
        surv.push({ wallet, nom: desc || '—', added: new Date().toISOString() });
        saveSurv();
        renderSurv();
        btn.classList.add('flagged');
        btn.textContent = '🚩 Marqué';
        showToast('🚩 ' + wallet + ' ajouté à la surveillance');
      } else {
        showToast('⚠️ Déjà sous surveillance');
      }
    });
  });
}

function updateStats(results) {
  const ids = ['statTotal', 'statVolume', 'statSuspect', 'statMoyen', 'statMax'];
  
  if (!results.length) {
    ids.forEach(id => document.getElementById(id).textContent = '—');
    return;
  }
  
  const volume = results.reduce((sum, tx) => sum + Number(tx.montant || 0), 0);
  const suspects = results.filter(tx => tx.annuler === true || tx.memoire_double_depot === true).length;
  const avg = Math.round(volume / results.length);
  const max = Math.max(...results.map(tx => Number(tx.montant || 0)));
  
  document.getElementById('statTotal').textContent = results.length;
  document.getElementById('statVolume').textContent = amountFmt(volume);
  document.getElementById('statSuspect').textContent = suspects;
  document.getElementById('statMoyen').textContent = amountFmt(avg);
  document.getElementById('statMax').textContent = amountFmt(max);
}

async function doSearch() {
  const data = await chargerTransactions();
  const qWallet = document.getElementById('q-wallet').value.trim().toLowerCase();
  const qDesc = document.getElementById('q-desc').value.trim().toLowerCase();
  const qStatut = document.getElementById('q-statut').value;
  const qMontant = parseFloat(document.getElementById('q-montant').value) || 0;
  
  const filtered = data.filter(tx => {
    const walletSrc = String(tx.wallet_source || '').toLowerCase();
    const walletDst = String(tx.wallet_destination || '').toLowerCase();
    const motif = String(tx.motif_transaction || tx.nom || '').toLowerCase();
    const ref = String(tx.id_transaction || '').toLowerCase();
    
    if (qWallet && !ref.includes(qWallet) && !walletSrc.includes(qWallet) && !walletDst.includes(qWallet)) return false;
    if (qDesc && !motif.includes(qDesc)) return false;
    if (qStatut === 'suspect' && !(tx.annuler === true || tx.memoire_double_depot === true)) return false;
    if (qStatut === 'valide' && tx.annuler === true) return false;
    if (Number(tx.montant) < qMontant) return false;
    
    return true;
  });
  
  renderResults(filtered);
  updateStats(filtered);
}

async function quickFilter(type) {
  document.querySelectorAll('.qf').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === type));
  document.getElementById('q-wallet').value = '';
  document.getElementById('q-desc').value = '';
  document.getElementById('q-statut').value = '';
  document.getElementById('q-montant').value = '';
  document.getElementById('searchInfo').textContent = '';
  document.getElementById('fraudeAlert').classList.remove('visible');
  
  const data = await chargerTransactions();
  let pool = data;
  
  if (type === 'suspect') {
    pool = data.filter(tx => tx.annuler === true || tx.memoire_double_depot === true);
  } else if (type === 'circulaire') {
    pool = data.filter(tx => tx.memoire_double_depot === true);
    if (pool.length) {
      document.getElementById('fraudeAlert').classList.add('visible');
      const wallets = [...new Set(pool.map(tx => String(tx.wallet_source)))];
      document.getElementById('fraudeWallets').innerHTML = wallets.map(w => `<span class="fraude-wallet-tag">${w}</span>`).join('');
    }
  } else if (type === 'plafond') {
    pool = data.filter(tx => Number(tx.montant) >= 200000);
    document.getElementById('searchInfo').textContent = 'Seuil : ≥ 200 000 FCFA';
  }
  
  renderResults(pool);
  updateStats(pool);
}

function resetSearch() {
  document.getElementById('q-wallet').value = '';
  document.getElementById('q-desc').value = '';
  document.getElementById('q-statut').value = '';
  document.getElementById('q-montant').value = '';
  document.getElementById('searchInfo').textContent = '';
  document.getElementById('fraudeAlert').classList.remove('visible');
  document.querySelectorAll('.qf').forEach((btn, idx) => btn.classList.toggle('active', idx === 0));
  
  document.getElementById('resultsCount').textContent = '0';
  document.getElementById('emptyState').innerHTML = '<div class="icon"></div><p>Lancez une recherche pour explorer le grand livre transactionnel.</p>';
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('resultsTable').style.display = 'none';
  
  ['statTotal', 'statVolume', 'statSuspect', 'statMoyen', 'statMax'].forEach(id => {
    document.getElementById(id).textContent = '—';
  });
}

function initSearch() {
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  document.getElementById('btnSearch').addEventListener('click', event => {
    event.preventDefault();
    doSearch();
  });
  
  document.getElementById('btnReset').addEventListener('click', event => {
    event.preventDefault();
    resetSearch();
  });
  
  document.querySelectorAll('.qf').forEach(btn => {
    btn.addEventListener('click', () => quickFilter(btn.dataset.filter));
  });
  
  renderSurv();
  chargerTransactions().then(data => {
    renderResults(data);
    updateStats(data);
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
