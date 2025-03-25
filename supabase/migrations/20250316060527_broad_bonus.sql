/*
  # Add Admin Policies for Orders

  1. Changes
    - Add policies to allow admins to view and manage all orders
    - Add policies to allow admins to view and manage all order items
  
  2. Security
    - Only admins can view/manage all orders
    - Regular users can still only view their own orders
*/

-- Add admin policies for orders table
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    OR
    user_id = auth.uid()
  );

CREATE POLICY "Admins can update all orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    OR
    user_id = auth.uid()
  );

-- Add admin policies for order_items table
CREATE POLICY "Admins can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    OR
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all order items"
  ON order_items
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    OR
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Allow admins to view all users
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Allow admins to update all users
CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Allow admins to delete users (if needed)
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );