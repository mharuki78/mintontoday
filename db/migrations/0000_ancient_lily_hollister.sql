CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" bigint NOT NULL,
	"attempts" integer NOT NULL
);
