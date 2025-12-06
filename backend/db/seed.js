import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Seed database with initial data from existing machine-config.json
 */
export function seedDatabase(db) {
  console.log('🌱 Seeding database...');

  try {
    // Read existing machine-config.json if it exists
    const configPath = path.join(__dirname, '../../dashboard/src/config/machine-config.json');
    
    if (!fs.existsSync(configPath)) {
      console.log('⚠️  No existing machine-config.json found, creating default site');
      createDefaultSite(db);
      return;
    }

    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // Create a default site
    const insertSite = db.prepare(`
      INSERT INTO sites (name, camera_url, camera_type, dewarp_params, stream_resolution)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const siteResult = insertSite.run(
      'Demo Center Site 1',
      'rtsp://placeholder-url', // Will be updated when user configures camera
      'generic',
      JSON.stringify({
        cx: 0.5,
        cy: 0.5,
        k1: -0.23,
        k2: -0.02
      }),
      '2560x1440'  // 2K QHD default
    );
    
    const siteId = siteResult.lastInsertRowid;
    console.log(`✅ Created site with ID: ${siteId}`);

    // Migrate machine regions from config
    const insertRegion = db.prepare(`
      INSERT INTO machine_regions (site_id, name, icon, x, y, width, height, is_default, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let order = 0;
    for (const machine of configData.machines) {
      // Skip the "all" machine as it's the default overview mode
      if (machine.id === 'all') {
        continue;
      }

      // Use crop coordinates if available
      const x = machine.crop?.x || 0;
      const y = machine.crop?.y || 0;
      const width = machine.crop?.width || 1920;
      const height = machine.crop?.height || 1080;

      insertRegion.run(
        siteId,
        machine.name || `Machine ${machine.id}`,
        machine.icon || '📦',
        x,
        y,
        width,
        height,
        machine.isDefault ? 1 : 0,
        order++
      );

      console.log(`✅ Migrated machine: ${machine.name}`);
    }

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

function createDefaultSite(db) {
  const insertSite = db.prepare(`
    INSERT INTO sites (name, camera_url, camera_type, dewarp_params, stream_resolution)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertSite.run(
    'Demo Center Site 1',
    'rtsp://placeholder-url',
    'generic',
    JSON.stringify({ cx: 0.5, cy: 0.5, k1: 0, k2: 0 }),
    '2560x1440'  // 2K QHD default
  );
  
  console.log('✅ Created default site');
}

// Run seed if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dbPath = path.join(__dirname, 'config.db');
  const db = new Database(dbPath);
  seedDatabase(db);
  db.close();
}

