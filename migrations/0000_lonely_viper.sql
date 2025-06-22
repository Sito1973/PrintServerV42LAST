CREATE TABLE "print_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_url" text NOT NULL,
	"document_name" text NOT NULL,
	"printer_id" integer,
	"user_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"copies" integer DEFAULT 1,
	"duplex" boolean DEFAULT false,
	"orientation" text DEFAULT 'portrait',
	"qz_tray_data" text
);
--> statement-breakpoint
CREATE TABLE "printers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"model" text,
	"status" text DEFAULT 'offline',
	"last_print_time" timestamp,
	"floor" text,
	"unique_id" text NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "printers_unique_id_unique" UNIQUE("unique_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"api_key" text NOT NULL,
	"is_admin" boolean DEFAULT false,
	"location" text,
	"floor" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_printer_id_printers_id_fk" FOREIGN KEY ("printer_id") REFERENCES "public"."printers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;