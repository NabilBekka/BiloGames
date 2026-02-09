-- Créer la table users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(8) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les codes de vérification email
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les codes de réinitialisation mot de passe
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON password_reset_codes(email);

-- Si la table existe déjà, ajouter les nouvelles colonnes
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id VARCHAR(8) UNIQUE;

-- Générer des user_id pour les utilisateurs existants qui n'en ont pas
-- Cette requête génère un ID unique à 8 chiffres pour chaque utilisateur sans user_id
UPDATE users 
SET user_id = LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0')
WHERE user_id IS NULL;
