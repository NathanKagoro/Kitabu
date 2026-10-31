-- owner_withdrawals: money the owner took out, for themselves or to the bank.
--
-- Owners and managers only, for reading as well as writing: how much the owner
-- draws is the owner's business, not the till's. No DELETE policy, as
-- everywhere: a mistake is soft-deleted (deleted_at) by an update.

ALTER TABLE public.owner_withdrawals ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP TRIGGER IF EXISTS owner_withdrawals_synced_at ON public.owner_withdrawals;
--> statement-breakpoint
CREATE TRIGGER owner_withdrawals_synced_at BEFORE INSERT OR UPDATE ON public.owner_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.touch_synced_at();
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS owner_withdrawals_synced_idx ON public.owner_withdrawals (synced_at);
--> statement-breakpoint

CREATE POLICY owner_withdrawals_select ON public.owner_withdrawals FOR SELECT
  USING (public.is_manager(business_id));
--> statement-breakpoint
CREATE POLICY owner_withdrawals_insert ON public.owner_withdrawals FOR INSERT
  WITH CHECK (public.is_manager(business_id));
--> statement-breakpoint
CREATE POLICY owner_withdrawals_update ON public.owner_withdrawals FOR UPDATE
  USING (public.is_manager(business_id)) WITH CHECK (public.is_manager(business_id));
--> statement-breakpoint

ALTER TABLE public.owner_withdrawals
  ADD CONSTRAINT owner_withdrawals_purpose_check CHECK (purpose IN ('personal', 'bank'));
--> statement-breakpoint
ALTER TABLE public.owner_withdrawals
  ADD CONSTRAINT owner_withdrawals_amount_check CHECK (amount > 0);
--> statement-breakpoint
ALTER TABLE public.owner_withdrawals
  ADD CONSTRAINT owner_withdrawals_method_check CHECK (method IN ('cash', 'mpesa', 'bank'));
--> statement-breakpoint

-- A day can no longer close on a negative count: cash in a tin is never below zero.
ALTER TABLE public.day_closings
  ADD CONSTRAINT day_closings_counted_check CHECK (counted_cash >= 0) NOT VALID;
