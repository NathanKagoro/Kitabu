-- fiscal_receipts: TRA receipts and adjustments (see db/schema.ts).
--
-- Everyone in the shop can read them (a cashier prints the receipt) and write
-- them (the demo connector runs on whichever phone made the sale). A live
-- connector will write from the server with the service role. No DELETE
-- policy: a receipt is cancelled by an adjustment, never removed.

ALTER TABLE public.fiscal_receipts ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP TRIGGER IF EXISTS fiscal_receipts_synced_at ON public.fiscal_receipts;
--> statement-breakpoint
CREATE TRIGGER fiscal_receipts_synced_at BEFORE INSERT OR UPDATE ON public.fiscal_receipts
  FOR EACH ROW EXECUTE FUNCTION public.touch_synced_at();
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS fiscal_receipts_synced_idx ON public.fiscal_receipts (synced_at);
--> statement-breakpoint

CREATE POLICY fiscal_receipts_select ON public.fiscal_receipts FOR SELECT
  USING (public.is_member(business_id));
--> statement-breakpoint
CREATE POLICY fiscal_receipts_insert ON public.fiscal_receipts FOR INSERT
  WITH CHECK (public.is_member(business_id));
--> statement-breakpoint
-- Only a pending receipt changes (to issued or failed); an issued one is final.
CREATE POLICY fiscal_receipts_update ON public.fiscal_receipts FOR UPDATE
  USING (public.is_member(business_id) AND status <> 'issued')
  WITH CHECK (public.is_member(business_id));
--> statement-breakpoint

ALTER TABLE public.fiscal_receipts
  ADD CONSTRAINT fiscal_receipts_kind_check CHECK (kind IN ('sale', 'adjustment'));
--> statement-breakpoint
ALTER TABLE public.fiscal_receipts
  ADD CONSTRAINT fiscal_receipts_mode_check CHECK (mode IN ('demo', 'live'));
--> statement-breakpoint
ALTER TABLE public.fiscal_receipts
  ADD CONSTRAINT fiscal_receipts_status_check CHECK (status IN ('pending', 'issued', 'failed'));
--> statement-breakpoint
-- The live global counter never repeats within a shop. (Demo counters are kept
-- per phone and may repeat across phones: a demo must never jam the sync queue.)
CREATE UNIQUE INDEX IF NOT EXISTS fiscal_receipts_gc_unique
  ON public.fiscal_receipts (business_id, gc) WHERE gc IS NOT NULL AND mode = 'live';
--> statement-breakpoint
-- One receipt and at most one adjustment per sale.
CREATE UNIQUE INDEX IF NOT EXISTS fiscal_receipts_sale_kind_unique
  ON public.fiscal_receipts (sale_id, kind);
--> statement-breakpoint

-- The public receipt page shows the fiscal receipt with the sale.
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
    ), '[]'::json),
    'fiscal', (
      SELECT json_build_object(
        'mode', f.mode, 'status', f.status, 'rctvNum', f.rctv_num, 'verifyUrl', f.verify_url,
        'gc', f.gc, 'dc', f.dc, 'znum', f.znum, 'vat', f.vat,
        'totalExclusive', f.total_exclusive, 'issuedAt', f.issued_at
      )
      FROM fiscal_receipts f WHERE f.sale_id = s.id AND f.kind = 'sale' LIMIT 1
    )
  )
  FROM sales s JOIN businesses b ON b.id = s.business_id
  WHERE s.receipt_token = p_token AND length(p_token) >= 8
  LIMIT 1;
$$;
