-- For the operator's console: when each shop last did anything, and how much
-- it sold in the last 30 days. Service role only (the accounts function).

CREATE OR REPLACE FUNCTION public.shop_activity()
RETURNS TABLE (business_id uuid, last_seen_at timestamptz, last_sale_at timestamptz, sales_30_days bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id,
         GREATEST(
           (SELECT max(synced_at) FROM sales s WHERE s.business_id = b.id),
           (SELECT max(synced_at) FROM stock_movements m WHERE m.business_id = b.id),
           (SELECT max(synced_at) FROM day_closings d WHERE d.business_id = b.id),
           (SELECT max(synced_at) FROM members p WHERE p.business_id = b.id)
         ),
         (SELECT max(client_created_at) FROM sales s WHERE s.business_id = b.id AND s.status = 'complete'),
         (SELECT count(*) FROM sales s
            WHERE s.business_id = b.id AND s.status = 'complete' AND s.client_created_at > now() - interval '30 days')
  FROM businesses b
  WHERE b.deleted_at IS NULL;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.shop_activity() FROM public;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.shop_activity() FROM anon, authenticated;
