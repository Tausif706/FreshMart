/*
  # Add admin RLS policies

  1. Purpose
    - Allow admin users to manage products and other tables
    - Fix the "violates row-level security policy" error when adding products
  
  2. Changes
    - Add policies for admin users to perform all operations on products table
    - Add similar policies for other admin-managed tables
*/

-- Add admin policies for products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Admins can manage products'
  ) THEN
    CREATE POLICY "Admins can manage products"
      ON products
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        )
      );
  END IF;
END $$;

-- Add admin policies for categories table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Admins can manage categories'
  ) THEN
    CREATE POLICY "Admins can manage categories"
      ON categories
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        )
      );
  END IF;
END $$;

-- Add admin policies for weekly_deals table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'weekly_deals' AND policyname = 'Admins can manage weekly deals'
  ) THEN
    CREATE POLICY "Admins can manage weekly deals"
      ON weekly_deals
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        )
      );
  END IF;
END $$;