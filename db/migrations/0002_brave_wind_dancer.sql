CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"bytes" integer NOT NULL,
	"created_at" bigint NOT NULL
);
