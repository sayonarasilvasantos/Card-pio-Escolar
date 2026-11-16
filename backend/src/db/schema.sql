CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'aluno'
    CHECK (role IN ('aluno', 'professor', 'colaborador', 'administrador')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(24) NOT NULL
    CHECK (category IN ('principal', 'acompanhamento', 'sobremesa', 'sopa')),
  calories NUMERIC(8, 2) NOT NULL CHECK (calories >= 0),
  protein NUMERIC(8, 2) NOT NULL CHECK (protein >= 0),
  carbs NUMERIC(8, 2) NOT NULL CHECK (carbs >= 0),
  fat NUMERIC(8, 2) NOT NULL CHECK (fat >= 0),
  fiber NUMERIC(8, 2) NOT NULL CHECK (fiber >= 0),
  description TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  allergens TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_day_dishes (
  menu_day_id UUID NOT NULL REFERENCES menu_days(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (menu_day_id, dish_id),
  UNIQUE (menu_day_id, position)
);

CREATE INDEX IF NOT EXISTS menu_day_dishes_dish_id_idx
  ON menu_day_dishes (dish_id);
