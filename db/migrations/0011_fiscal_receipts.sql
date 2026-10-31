CREATE TABLE "fiscal_receipts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"kind" text DEFAULT 'sale' NOT NULL,
	"mode" text DEFAULT 'demo' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"gc" bigint,
	"dc" bigint,
	"znum" text,
	"rctv_num" text,
	"verify_url" text,
	"total_inclusive" bigint NOT NULL,
	"total_exclusive" bigint NOT NULL,
	"vat" bigint NOT NULL,
	"provider" text,
	"ack_code" text,
	"ack_message" text,
	"issued_at" timestamp with time zone,
	"created_by" uuid,
	"client_created_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fiscal_receipts" ADD CONSTRAINT "fiscal_receipts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fiscal_receipts_time_idx" ON "fiscal_receipts" USING btree ("business_id","client_created_at");--> statement-breakpoint
CREATE INDEX "fiscal_receipts_sale_idx" ON "fiscal_receipts" USING btree ("sale_id");