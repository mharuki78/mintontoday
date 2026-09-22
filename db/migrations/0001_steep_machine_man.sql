CREATE TABLE "admin_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"version" text NOT NULL,
	"updated_at" bigint NOT NULL
);
