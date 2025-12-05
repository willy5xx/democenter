-- Virtual PTZ Database Schema
-- Migration 001: Initial Schema

-- Sites table: stores camera/site configurations
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  camera_url TEXT NOT NULL,
  camera_type TEXT DEFAULT 'generic',
  dewarp_params TEXT DEFAULT '{}', -- JSON: {cx, cy, k1, k2, etc.}
  stream_resolution TEXT DEFAULT '1920x1080',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Machine regions table: stores virtual PTZ regions for each site
CREATE TABLE IF NOT EXISTS machine_regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  is_default INTEGER DEFAULT 0, -- 0 = false, 1 = true
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Settings table: stores application settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_machine_regions_site_id ON machine_regions(site_id);
CREATE INDEX IF NOT EXISTS idx_machine_regions_display_order ON machine_regions(site_id, display_order);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
  ('transition_style', 'smooth'), -- smooth, eased, instant
  ('transition_duration', '300'), -- milliseconds
  ('show_fps_overlay', 'false'),
  ('show_region_boundaries', 'false');

