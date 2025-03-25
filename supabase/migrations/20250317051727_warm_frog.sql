/*
  # Add Admin Role Management Policies

  1. Purpose
    - Allow admins to update user roles
    - Maintain existing user self-management capabilities
    - Ensure proper access control for role updates

  2. Changes
    - Add new policy for admin role management
*/

-- Add policy for admins to update any user
CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Modify existing update policy to exclude role column for regular users
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile except role"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    AND NOT (
      SELECT COALESCE(
        current_setting('app.current_user_is_admin', true) = 'off',
        true
      )
    )
  )
  WITH CHECK (
    auth.uid() = id
    AND NOT (
      SELECT COALESCE(
        current_setting('app.current_user_is_admin', true) = 'off',
        true
      )
    )
  );