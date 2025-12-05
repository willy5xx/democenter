-- Add transition_speed column to sites table
-- Migration 002: Add transition speed setting per site

ALTER TABLE sites ADD COLUMN transition_speed INTEGER DEFAULT 300;

-- Update existing sites to have default transition speed
UPDATE sites SET transition_speed = 300 WHERE transition_speed IS NULL;

