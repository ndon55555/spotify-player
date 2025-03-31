CREATE TABLE "playlist_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"playlist_id" varchar(255) NOT NULL,
	"track_id" varchar(255) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
