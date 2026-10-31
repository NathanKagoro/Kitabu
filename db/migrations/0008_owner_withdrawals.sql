ALTER TYPE "public"."payment_method" ADD VALUE 'owner';--> statement-breakpoint
CREATE TABLE "owner_withdrawals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"method" "payment_method" DEFAULT 'cash' NOT NULL,
	"purpose" text DEFAULT 'personal' NOT NULL,
	"note" text,
	"created_by" uuid,
	"member_id" uuid,
	"client_created_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "owner_withdrawals" ADD CONSTRAINT "owner_withdrawals_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "owner_withdrawals_time_idx" ON "owner_withdrawals" USING btree ("business_id","client_created_at");