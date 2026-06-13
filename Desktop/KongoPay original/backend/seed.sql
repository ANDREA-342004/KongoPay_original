-- Rôles
INSERT INTO role (nom_role) VALUES 
('standard'),
('commercant'),
('agent');

-- Utilisateurs
INSERT INTO utilisateur (nom, telephone, hash_pin, type_compte, id_role) VALUES
('Mbemba Céleste', '06 111 22 33', '$2b$10$hash1', 'standard', 7),
('Bibila Marie', '05 987 65 43', '$2b$10$hash2', 'commercant', 8),
('Louzolo Pierre', '06 456 78 90', '$2b$10$hash3', 'standard', 7),
('Massamba Grace', '05 321 65 87', '$2b$10$hash4', 'agent', 9),
('Nkounkou Paul', '06 789 01 23', '$2b$10$hash5', 'standard', 7),
('Bouanga Serge', '05 444 55 66', '$2b$10$hash6', 'standard', 7),
('Kinzaba Lucie', '06 777 88 99', '$2b$10$hash7', 'commercant', 8);

-- Wallets
INSERT INTO wallet (nom, solde, devise, id_utilisateur) VALUES
('Wallet Mpaka', 150000, 'FCFA', 1),
('Wallet Mbemba', 200000, 'FCFA', 17),
('Wallet Bibila', 500000, 'FCFA', 18),
('Wallet Louzolo', 75000, 'FCFA', 19),
('Wallet Massamba', 250000, 'FCFA', 20),
('Wallet Nkounkou', 30000, 'FCFA', 21),
('Wallet Bouanga', 120000, 'FCFA', 22),
('Wallet Kinzaba', 450000, 'FCFA', 23);

-- Transactions
INSERT INTO transaction (nom, montant, motif_transaction, wallet_source, wallet_destination) VALUES
('Paiement Grand Marché Tié-Tié', 25000, 'achat', 8, 9),
('Transfert P2P Pointe-Noire', 50000, 'transfert', 9, 10),
('Achat carburant Total', 15000, 'achat', 10, 11),
('Règlement facture eau SNDE', 8500, 'facture', 11, 12),
('Transfert Brazzaville', 100000, 'transfert', 12, 13),
('Achat marché Mpaka', 12000, 'achat', 13, 14),
('Paiement restaurant Lumumba', 35000, 'achat', 14, 15);