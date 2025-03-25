/*
  # Add weekly_deals table

  1. New Tables
    - `weekly_deals`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, not null)
      - `original_price` (decimal, not null)
      - `sale_price` (decimal, not null)
      - `discount` (integer, not null)
      - `image_url` (text, not null)
      - `start_date` (date, not null)
      - `end_date` (date, not null)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `weekly_deals` table
    - Add policy for public to view weekly deals
    - Add policy for admins to manage weekly deals
*/

CREATE TABLE IF NOT EXISTS weekly_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  original_price decimal NOT NULL CHECK (original_price >= 0),
  sale_price decimal NOT NULL CHECK (sale_price >= 0),
  discount integer NOT NULL CHECK (discount >= 0 AND discount <= 100),
  image_url text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_deals ENABLE ROW LEVEL SECURITY;

-- Public can view weekly deals
CREATE POLICY "Weekly deals are publicly viewable"
  ON weekly_deals
  FOR SELECT
  TO public
  USING (true);

-- Only admins can manage weekly deals
-- Modify the admin policy to explicitly allow all operations
CREATE POLICY "Admins can manage weekly deals"
  ON weekly_deals
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );