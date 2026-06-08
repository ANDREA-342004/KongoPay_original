ROLE
CREATE TABLE role (
  id_role SERIAL PRIMARY KEY,
  nom_role VARCHAR(30) UNIQUE NOT NULL
);
USER
CREATE TABLE utilisateur (
  id_user UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_role INT REFERENCES role(id_role),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(15) UNIQUE NOT NULL,
  num_piece_identite VARCHAR(50) UNIQUE,
  adresse TEXT,
  pin_hash VARCHAR(255) NOT NULL,
  statut VARCHAR(20) DEFAULT 'ACTIF',
  date_creation TIMESTAMP DEFAULT NOW()
);

-- WALLET
CREATE TABLE wallet (
  id_wallet UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_user UUID NOT NULL REFERENCES utilisateur(id_user),
  num_wallet VARCHAR(20) UNIQUE NOT NULL,
  solde DECIMAL(15,2) DEFAULT 0 NOT NULL,
  devise VARCHAR(5) DEFAULT 'FCFA',
  plafond_journalier DECIMAL(15,2) DEFAULT 500000,
  cle_publique TEXT,
  statut VARCHAR(20) DEFAULT 'ACTIF'
);

-- KYC
CREATE TABLE kyc (
  id_kyc UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_user UUID NOT NULL REFERENCES utilisateur(id_user),
  type_piece VARCHAR(30) NOT NULL,
  numero_piece VARCHAR(50) UNIQUE NOT NULL,
  date_naissance DATE,
  statut_verification statut_kyc DEFAULT 'EN_ATTENTE',
  date_verification TIMESTAMP
);

-- SESSION
CREATE TABLE session (
  id_session UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_user UUID NOT NULL REFERENCES utilisateur(id_user),
  token_jeton TEXT UNIQUE NOT NULL,
  date_expiration TIMESTAMP NOT NULL,
  adresse_ip VARCHAR(45),
  est_active BOOLEAN DEFAULT TRUE,
  date_creation TIMESTAMP DEFAULT NOW()
);

-- TRANSACTION
CREATE TABLE transaction (
  id_transaction UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reference VARCHAR(50) UNIQUE,
  wallet_source UUID NOT NULL REFERENCES wallet(id_wallet),
  wallet_destination UUID NOT NULL REFERENCES wallet(id_wallet),
  montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
  type_transaction type_tx NOT NULL,
  statut statut_tx DEFAULT 'EN_COURS',
  signature_numerique TEXT,
  date_transaction TIMESTAMP DEFAULT NOW() NOT NULL
);

-- FACTURE
CREATE TABLE facture (
  id_facture UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_wallet UUID NOT NULL REFERENCES wallet(id_wallet),
  libelle VARCHAR(200) NOT NULL,
  montant DECIMAL(15,2) NOT NULL,
  date_echeance DATE,
  statut VARCHAR(20) DEFAULT 'EN_ATTENTE'
);

-- PAIEMENT_FACTURE
CREATE TABLE paiement_facture (
  id_paiement UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_facture UUID NOT NULL REFERENCES facture(id_facture),
  id_transaction UUID NOT NULL REFERENCES transaction(id_transaction),
  date_paiement TIMESTAMP DEFAULT NOW() NOT NULL,
  montant DECIMAL(15,2) NOT NULL
);

-- QR_CODE
CREATE TABLE qr_code (
  id_qr UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_wallet UUID NOT NULL REFERENCES wallet(id_wallet),
  code_qr TEXT UNIQUE NOT NULL,
  date_generation TIMESTAMP DEFAULT NOW()
);

-- ALERTE_FRAUDE
CREATE TABLE alerte_fraude (
  id_alerte UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_transaction UUID REFERENCES transaction(id_transaction),
  id_wallet_suspect UUID NOT NULL REFERENCES wallet(id_wallet),
  type_alerte VARCHAR(50) NOT NULL,
  niveau_risque DECIMAL(5,2),
  description TEXT,
  date_detection TIMESTAMP DEFAULT NOW() NOT NULL,
  statut VARCHAR(20) DEFAULT 'OUVERTE'
);

-- ENQUETE_CONFORMITE
CREATE TABLE enquete_conformite (
  id_enquete UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_alerte UUID NOT NULL REFERENCES alerte_fraude(id_alerte),
  id_superviseur UUID NOT NULL REFERENCES utilisateur(id_user),
  date_couverture TIMESTAMP DEFAULT NOW(),
  commentaire TEXT,
  decision VARCHAR(50)
);

-- COMPTE_SURVEILLE
CREATE TABLE compte_surveille (
  id_surveillance UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_wallet UUID NOT NULL REFERENCES wallet(id_wallet),
  id_superviseur UUID NOT NULL REFERENCES utilisateur(id_user),
  motif TEXT,
  date_ajout TIMESTAMP DEFAULT NOW() NOT NULL
);

-- AUDIT_LOG
CREATE TABLE audit_log (
  id_log UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_user UUID REFERENCES utilisateur(id_user),
  id_transaction UUID REFERENCES transaction(id_transaction),
  action VARCHAR(50) NOT NULL,
  date_action TIMESTAMP DEFAULT NOW() NOT NULL,
  detail JSONB
);

-- COMMERCANT
CREATE TABLE commercant (
  id_commercant UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_user UUID NOT NULL REFERENCES utilisateur(id_user),
  id_wallet UUID NOT NULL REFERENCES wallet(id_wallet),
  nom_commerce VARCHAR(150) NOT NULL,
  localisation VARCHAR(200),
  est_verifie BOOLEAN DEFAULT FALSE
);