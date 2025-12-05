import fs from 'fs';
import path from 'path';
import readline from 'readline';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DB_PATH = path.join(__dirname, '../db/config.db');

// Ensure DB exists
if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Database not found at ${DB_PATH}. Please run 'npm run db:migrate' first.`);
  process.exit(1);
}

const db = new Database(DB_PATH);

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🎥 vendVision Camera Setup Wizard');
  console.log('=================================\n');
  
  console.log('We will configure your Tapo camera connection.');
  console.log('You will need your camera IP address and Tapo account credentials.\n');

  try {
    const ip = await askQuestion('📷 Camera IP Address (e.g., 192.168.1.50): ');
    const username = await askQuestion('👤 Tapo Username: ');
    const password = await askQuestion('🔑 Tapo Password: ');

    if (!ip || !username || !password) {
      console.log('❌ All fields are required. Exiting.');
      process.exit(1);
    }

    // Construct Tapo RTSP URL
    // Standard format for Tapo C200/C210/C310: rtsp://username:password@ip:554/stream1
    // We need to URL encode the username/password in case of special chars
    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);
    const rtspUrl = `rtsp://${encodedUser}:${encodedPass}@${ip}:554/stream1`;

    console.log(`\n🔗 Constructed URL: rtsp://****:****@${ip}:554/stream1`);

    // Update the database
    // Check if site exists
    const row = db.prepare('SELECT id FROM sites LIMIT 1').get();

    if (row) {
      // Update existing
      db.prepare(`
        UPDATE sites SET 
          camera_url = ?, 
          camera_type = 'tapo-c200',
          name = 'Demo Center (Tapo)'
        WHERE id = ?
      `).run(rtspUrl, row.id);
      console.log('✅ Camera configuration saved!');
    } else {
      // Insert new
      db.prepare(`
        INSERT INTO sites (name, camera_url, camera_type, dewarp_params, stream_resolution) 
        VALUES (?, ?, ?, ?, ?)
      `).run('Demo Center (Tapo)', rtspUrl, 'tapo-c200', '{"enable_dewarp":false}', '1920x1080');
      console.log('✅ Camera configuration created!');
    }

    finalize();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function finalize() {
  console.log('🔄 Updating streaming configuration...');
  const generateScript = path.join(__dirname, 'generate-go2rtc-config.js');
  
  try {
    db.close();
    execSync(`node "${generateScript}"`, { stdio: 'inherit' });
    
    console.log('\n🎉 Setup Complete!');
    console.log('You can now run ./start-vendvision.sh to start the demo center.');
    process.exit(0);
  } catch (e) {
    console.error('⚠️ Could not auto-generate go2rtc config:', e.message);
    process.exit(0);
  }
}

main();
