-- Créer la table users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  username VARCHAR(50) UNIQUE,
  birth_date DATE,
  google_id VARCHAR(255) UNIQUE,
  profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Si la table existe déjà, ajouter les nouvelles colonnes
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Mettre profile_complete à true pour les utilisateurs existants avec mot de passe
UPDATE users SET profile_complete = true WHERE password IS NOT NULL AND profile_complete IS NULL;
