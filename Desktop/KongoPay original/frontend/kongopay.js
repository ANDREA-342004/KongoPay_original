const API = 'http://localhost:3000/api';
let accountType = 'standard';

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.getElementById('panel-creer').classList.toggle('active', tab === 'creer');
  document.getElementById('panel-connexion').classList.toggle('active', tab === 'connexion');
}

function selectType(type) {
  accountType = type;
  document.querySelectorAll('.type-option').forEach(opt => opt.classList.toggle('selected', opt.dataset.type === type));
}

function advancePin(input) {
  if (input.value.length === 1) {
    const pins = Array.from(input.closest('.pin-row').querySelectorAll('.pin-digit'));
    const next = pins[pins.indexOf(input) + 1];
    if (next) next.focus();
  }
}

function updateKYC(fileInput) {
  if (fileInput.files[0]) {
    document.getElementById('kyc-label').textContent = '✅ ' + fileInput.files[0].name;
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function resetForm() {
  document.getElementById('form-creation').style.display = 'block';
  document.getElementById('successScreen').classList.remove('show');
  document.getElementById('fullname').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('ville').value = '';
  document.getElementById('kyc-label').textContent = 'CNI, Passeport ou Carte de séjour — appuyez pour charger';
  document.querySelectorAll('#panel-creer .pin-digit').forEach(pin => pin.value = '');
}

async function creerWallet() {
  const name = document.getElementById('fullname').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const ville = document.getElementById('ville').value;
  const pins = Array.from(document.querySelectorAll('#panel-creer .pin-digit')).map(pin => pin.value);
  if (!name) return showToast('⚠️ Entrez votre nom complet');
  if (!phone) return showToast('⚠️ Entrez votre numéro de téléphone');
  if (!ville) return showToast('⚠️ Choisissez votre ville');
  if (pins.some(digit => !digit)) return showToast('⚠️ Code PIN incomplet');
  
  const pin = pins.join('');
  const button = document.getElementById('create-wallet-btn');
  button.disabled = true;
  button.textContent = '⏳ Création en cours…';
  
  try {
    const resRegister = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: name, telephone: phone, pin })
    });
    const registerData = await resRegister.json();
    if (!resRegister.ok) throw new Error(registerData.error || 'Erreur inscription');
    
    const userId = registerData.user?.id;
    if (!userId) throw new Error('Utilisateur introuvable');
    
    const resLogin = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone: phone, pin })
    });
    const loginData = await resLogin.json();
    if (!resLogin.ok) throw new Error(loginData.error || 'Erreur connexion');
    
    const token = loginData.token;
    localStorage.setItem('kp_token', token);
    localStorage.setItem('kp_user_id', userId);
    
    const resWallet = await fetch(`${API}/wallet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id_utilisateur: userId })
    });
    const walletData = await resWallet.json();
    if (!resWallet.ok) throw new Error(walletData.error || 'Erreur création wallet');
    
    const walletId = walletData.wallet?.id_wallet;
    if (!walletId) throw new Error('Wallet introuvable');
    localStorage.setItem('kp_wallet_id', walletId);
    document.getElementById('walletId').textContent = `KP-${walletId}`;
    document.getElementById('form-creation').style.display = 'none';
    document.getElementById('successScreen').classList.add('show');
  } catch (err) {
    showToast('❌ ' + err.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Ouvrir mon portefeuille';
  }
}

async function connexion() {
  const phone = document.getElementById('login-id').value.trim();
  const pins = Array.from(document.querySelectorAll('#panel-connexion .pin-digit')).map(pin => pin.value);
  if (!phone) return showToast('⚠️ Entrez votre numéro de téléphone');
  if (pins.some(digit => !digit)) return showToast('⚠️ Code PIN incomplet');
  
  const pin = pins.join('');
  const button = document.getElementById('connexion-btn');
  button.disabled = true;
  button.textContent = '⏳ Connexion…';
  
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone: phone, pin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur connexion');
    
    localStorage.setItem('kp_token', data.token);
    showToast('✅ Connecté ! Redirection…');
    setTimeout(() => window.location.href = 'dashboard.html', 1200);
  } catch (err) {
    showToast('❌ ' + err.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Accéder à mon portefeuille';
  }
}

function initIndex() {
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  document.querySelectorAll('.type-option').forEach(opt => opt.addEventListener('click', () => selectType(opt.dataset.type)));
  document.querySelectorAll('.pin-digit').forEach(pin => pin.addEventListener('input', () => advancePin(pin)));
  
  const kycUpload = document.querySelector('.kyc-upload');
  const kycFile = document.getElementById('kyc-file');
  if (kycUpload && kycFile) {
    kycUpload.addEventListener('click', () => kycFile.click());
    kycFile.addEventListener('change', () => updateKYC(kycFile));
  }
  
  document.getElementById('create-wallet-btn').addEventListener('click', creerWallet);
  document.getElementById('connexion-btn').addEventListener('click', connexion);
  document.getElementById('reset-form-btn').addEventListener('click', resetForm);
}

document.addEventListener('DOMContentLoaded', initIndex);
