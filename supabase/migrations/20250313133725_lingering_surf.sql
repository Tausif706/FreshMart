/*
  # Add Order Approvals and Tracking

  1. New Tables
    - `order_approvals`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `admin_id` (uuid, foreign key)
      - `status` (text) - pending/approved/rejected
      - `comment` (text)
      - `created_at` (timestamp)

  2. Changes to Orders Table
    - Add tracking-related columns
    - Add approval status
*/

-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS tracking_url text,
ADD COLUMN IF NOT EXISTS estimated_delivery timestamptz,
ADD COLUMN IF NOT EXISTS actual_delivery timestamptz,
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending';

-- Create order_approvals table
CREATE TABLE IF NOT EXISTS order_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_id, admin_id)
);

-- Enable RLS
ALTER TABLE order_approvals ENABLE ROW LEVEL SECURITY;

-- Policies for order_approvals
CREATE POLICY "Admins can manage order approvals"
  ON order_approvals
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "Users can view their order approvals"
  ON order_approvals
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );