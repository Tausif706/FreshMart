/*
  # Create featured products view

  1. New View
    - `featured_products_view`
      - Shows top-selling products from the last 30 days
      - Includes product details needed for display
  
  2. Purpose
    - Automatically identifies best-selling products
    - Makes it easy to query featured products without complex joins
*/

-- Create a view for featured products based on sales in the last 30 days
CREATE OR REPLACE VIEW featured_products_view AS
SELECT 
  p.id,
  p.name,
  p.price,
  p.image_url,
  p.category_id,
  c.name as category_name,
  COUNT(oi.id) as order_count,
  SUM(oi.quantity) as total_quantity
FROM 
  products p
LEFT JOIN 
  order_items oi ON p.id = oi.product_id
LEFT JOIN 
  orders o ON oi.order_id = o.id
LEFT JOIN
  categories c ON p.category_id = c.id
WHERE 
  o.created_at >= NOW() - INTERVAL '30 days'
  OR o.created_at IS NULL -- Include products with no orders too
GROUP BY 
  p.id, p.name, p.price, p.image_url, p.category_id, c.name
ORDER BY 
  total_quantity DESC NULLS LAST, -- Sort by quantity sold
  p.created_at DESC; -- For products with no sales, show newest first

-- Grant access to the view
GRANT SELECT ON featured_products_view TO public;