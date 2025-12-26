-- Create the user_registered table for the claw machine game
-- Run this SQL in your neon.tech database

CREATE TABLE public.user_registered (
	username varchar NOT NULL,
	"password" varchar NOT NULL,
	email varchar NOT NULL,
	reset_token varchar NOT NULL,
	CONSTRAINT user_pk PRIMARY KEY (username)
);
