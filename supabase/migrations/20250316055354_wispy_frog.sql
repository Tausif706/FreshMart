/*
  # Add Email Notifications System

  1. New Tables
    - `admin_notifications`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key)
      - `order_id` (uuid, foreign key)
      - `type` (text) - 'order_approval'
      - `status` (text) - 'pending', 'read'
      - `created_at` (timestamp)
      - `read_at` (timestamp, nullable)

  2. New Functions
    - `create_admin_notifications()`: Creates notifications for all admins when a new order is placed
    - `notify_admins_on_order()`: Trigger function to handle new order notifications

  3. Security
    - Enable RLS on new tables
    - Add policies for admin access
*/

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'order_approval',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  UNIQUE(admin_id, order_id, type)
);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create function to handle new order notifications
CREATE OR REPLACE FUNCTION notify_admins_on_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (admin_id, order_id)
  SELECT 
    id as admin_id,
    NEW.id as order_id
  FROM users
  WHERE role = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS on_order_created ON orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_order();

-- Add policies for admin_notifications
CREATE POLICY "Admins can view their notifications"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = admin_id AND
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update their notifications"
  ON admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = admin_id AND
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );