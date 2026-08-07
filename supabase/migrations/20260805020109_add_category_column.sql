ALTER TABLE memes ADD COLUMN IF NOT EXISTS category text;
CREATE INDEX IF NOT EXISTS memes_category_idx ON memes (category) WHERE category IS NOT NULL;
