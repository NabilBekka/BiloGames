# BiloGames Web 🎮

Application web Next.js + Node.js + PostgreSQL

## Installation

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Édite .env avec ta DATABASE_URL de Neon
```

Exécute le SQL dans `init.sql` sur ta base de données Neon (via la console web).

```bash
npm run dev
```

Le serveur tourne sur http://localhost:5000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'app tourne sur http://localhost:3000

## Fonctionnalités

- ✅ Page d'accueil avec grille de jeux
- ✅ Login (Google, Facebook, Email)
- ✅ Register avec validation complète
  - Email valide
  - Prénom/Nom (lettres uniquement)
  - Pseudo
  - Mot de passe (8 chars, maj, min, spécial)
  - Date de naissance
- ✅ Bouton œil pour voir le mot de passe
- ✅ "Hello [pseudo]" quand connecté
- ✅ Logout

## Stack

- **Frontend**: Next.js 14, React 18, CSS Modules
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon)
- **Auth**: JWT

---
Made with 💜 for BiloGames
