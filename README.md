# 🟢 KongoPay — Portefeuille Numérique Congolais

> Plateforme de paiement et de gestion financière numérique conçue pour la République du Congo.

* Description

**KongoPay** est une application web fullstack simulant un portefeuille numérique adapté au contexte congolais. Elle permet aux utilisateurs d'envoyer de l'argent, de payer des factures, et aux agents de conformité de surveiller les transactions suspectes en temps réel.

Projet académique réalisé dans le cadre de la formation **GIIA2** à l'**ECAM de Pointe-Noire**.

* Fonctionnalités

* Espace Utilisateur
- Création de compte avec code PIN sécurisé
- Connexion sécurisée (JWT)
- Envoi et réception d'argent entre portefeuilles
- Paiement de factures
- Historique des transactions

*Espace Superviseur / Conformité
- Tableau de bord en temps réel
- Surveillance des transactions suspectes
- Gestion des alertes fraude
- Visualisation des réserves de change
- Recherche et filtrage des flux financiers

*Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | Node.js, Express.js |
| Base de données | PostgreSQL |
| Authentification | JWT + bcryptjs |
| Variables d'environnement | dotenv |
| Tests API | Postman |
| Versioning | Git + GitHub |

* Structure du projet

```
KongoPay/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   └── auth.js
│   ├── .env
│   ├── server.js
│   └── package.json
└── frontend/
    ├── index.html
    ├── kongopay.js
    ├── kongopay.css
    ├── dashboard.html
    ├── dashboard.js
    ├── dashboard.css
    ├── search.html
    ├── search.js
    └── search.css
```

*Installation et lancement

* Prérequis
- Node.js installé
- PostgreSQL installé et configuré
- pgAdmin 4 (optionnel)

* Étapes

1. Cloner le dépôt**
```bash
git clone https://github.com/ANDREA-342004/KongoPay_original.git
cd KongoPay_original
```

2. Installer les dépendances backend**
```bash
cd backend
npm install
```

3. Configurer les variables d'environnement**

Crée un fichier `.env` dans le dossier `backend` :
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=KongoPay
DB_USER=postgres
DB_PASSWORD=ton_mot_de_passe
JWT_SECRET=ton_secret_jwt
PORT=3000
```

4. Lancer le serveur**
```bash
node server.js
```

5. Ouvrir le frontend**

Ouvre `frontend/index.html` dans ton navigateur.

*Comptes de test

| Rôle | Téléphone | PIN |
|---|---|---|
| Superviseur | 064000001 | (défini à la création) |
| Utilisateur standard | 06 123 45 67 | (défini à la création) |

*Aperçu

* Page d'accueil
Interface d'inscription et de connexion avec sélection du type de compte (Standard, Commerçant, Agent).

*Tableau de bord Conformité
Surveillance en temps réel des transactions, alertes fraude, réserves de change et comptes sous surveillance.

Recherche & Flux
Filtrage avancé des transactions par statut, profil, montant et description.

 Auteur

ANDREA Izya — Étudiant en 2ème année, filière GIIA2  
ECAM Pointe-Noire, Congo  
Année académique 2025–2026
