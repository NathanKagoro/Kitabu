-- Receipts carry the shop's logo too (set by the operator; a small inline image
-- or an https link, see supabase/functions/accounts/rules.ts).

CREATE OR REPLACE FUNCTION public.public_receipt(p_token text)
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'business', json_build_object(
      'name', b.name, 'phone', b.phone, 'tin', b.tin,
      'footer', b.settings ->> 'receiptFooter',
      'address', b.settings ->> 'address',
      'brandColor', b.settings ->> 'brandColor',
      'logoUrl', b.settings ->> 'logoUrl',
      'tillNumbers', b.settings -> 'tillNumbers'
    ),
    'sale', json_build_object(
      'total', s.total, 'discount', s.discount, 'status', s.status,
      'createdAt', s.client_created_at
    ),
    'lines', coalesce((
      SELECT json_agg(json_build_object(
        'description', coalesce(l.description, ''), 'qty', l.qty,
        'unitPrice', l.unit_price, 'lineTotal', l.line_total
      ) ORDER BY l.id)
      FROM sale_lines l WHERE l.sale_id = s.id
    ), '[]'::json)
  )
  FROM sales s JOIN businesses b ON b.id = s.business_id
  WHERE s.receipt_token = p_token AND length(p_token) >= 8
  LIMIT 1;
$$;
