CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  title_kr TEXT NOT NULL,
  title_en TEXT,
  title_ja TEXT,
  year TEXT,
  country JSONB,
  genre JSONB,
  grade NUMERIC,
  casting JSONB,
  cast_search TEXT,
  overview JSONB,
  vote_average NUMERIC,
  poster_key JSONB,
  category TEXT NOT NULL DEFAULT 'movie',
  tmdb_id INTEGER,
  media_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
