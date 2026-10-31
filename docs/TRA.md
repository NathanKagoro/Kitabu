# TRA receipts

Kitabu is built so every sale can carry a TRA fiscal receipt. Shops switch it on in **Mipangilio → Sehemu za programu → Risiti za TRA** (off by default). Until a shop is registered with TRA, its receipts are **demo** receipts: they behave like TRA's, but are marked "MFANO / DEMO", start with `DEMO`, and carry no TRA link, so they can never pass for real ones.

## How it works

```
sale saved (lib/local/sale.ts)
  → shop has "traReceipts" on?  no → done
  → lib/fiscal/issue.ts          totals, VAT by tax code, the connector for this shop
  → connector.issue()            demo: next counters, DEMO<gc>
                                 live: queued as "pending" for the server
  → fiscal_receipts row          synced like any other record; shown on the receipt
sale voided (lib/local/actions.ts voidSale)
  → an "adjustment" receipt cancels the original, as TRA requires (never a delete)
```

- **Counters:** a global counter (GC) that never resets and never repeats, a daily counter (DC) that restarts each business day, and the day's Z number (`YYYYMMDD`). `nextCounters()` in `lib/fiscal/tra.ts`.
- **Verification number:** `RCTVNUM = RECEIPTCODE + GC`. The verification link is `https://virtual.tra.go.tz/efdmsRctVerify/<RCTVNUM>` for live receipts only.
- **The message TRA expects:** `rctXml()` builds the `<RCT>` section (items, totals, VAT totals, payments, customer), unsigned.
- **Sales are already locked.** A sale is never edited; owners and managers void it with a reason, stock comes back, and with TRA on an adjustment is issued.
- **Database:** `fiscal_receipts` (migrations 0011 and 0012). Everyone in the shop can read and write receipts; an issued receipt can't be changed or deleted; live counters are unique per shop.

## Going live (not built yet)

1. **Register the shop** with TRA (or through a VFD provider): TIN, VRN certificate, application letter. TRA issues the signing certificate (`.pfx`), its serial, and after registration a REGID and RECEIPTCODE.
2. **Server connector.** A Supabase Edge Function (`supabase/functions/fiscal`) that holds the shop's certificate encrypted, takes pending receipts, assigns the live counters atomically, signs `<RCT>` with SHA1withRSA, posts it (`/efdmsRctApi/api/efdmsRctInfo` or the provider's API), and marks the receipt issued with its RCTVNUM and link. It also sends the daily Z report before the next day's first sale. The certificate never goes to a phone: it can issue receipts in the business's name.
3. **Operator sets the shop to live:** `settings.fiscal = { mode: 'live', regId, efdSerial, receiptCode, provider }`. From then on the phone queues receipts as pending (`liveQueueConnector`) and the server issues them.
4. **QR code** on the receipt, pointing at the verification link (live receipts only).

## To confirm with TRA or the provider

- Tax codes: we map standard → 1 (A), zero-rated → 3 (C), exempt → 5 (E). Registration returns the codes a taxpayer uses.
- Payment types: bank transfer is sent as `CHEQUE`; confirm.
- Customer ID types other than TIN (1) and none (6).
- Receipts for traders who are not VAT-registered.
- Whether a discount is sent per item or as `DISCOUNT` on the totals (we send the totals field).

The API notes we followed are a community copy of TRA's documentation, last updated in 2021: confirm the current version before building the live connector.
