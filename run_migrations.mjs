import mysql2 from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_URL = 'mysql://root:yJGEnehAaFLkIcXVxtKNXgKtljwoisgm@metro.proxy.rlwy.net:46592/railway';

const migrationFiles = [
  '0000_complex_matthew_murdock.sql',
  '0001_mighty_stranger.sql',
  '0002_flawless_impossible_man.sql',
  '0003_omniscient_blue_blade.sql',
  '0004_silky_naoko.sql',
  '0005_huge_may_parker.sql',
  '0006_brown_gertrude_yorkes.sql',
  '0007_sad_mulholland_black.sql',
  '0008_dusty_squadron_sinister.sql',
  '0009_daffy_lilith.sql',
  '0010_sudden_scarlet_witch.sql',
  '0011_perpetual_red_hulk.sql',
  '0012_complex_hellcat.sql',
  '0013_curvy_freak.sql',
  '0014_remarkable_spot.sql',
  '0015_dashing_warpath.sql',
  '0016_faulty_doctor_spectrum.sql',
];

async function runMigrations() {
  const conn = await mysql2.createConnection(DB_URL);
  console.log('Connected to Railway MySQL');

  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, 'drizzle', file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by statement separator and run each statement
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`\nRunning ${file} (${statements.length} statements)...`);
    
    for (const stmt of statements) {
      if (!stmt || stmt.startsWith('--')) continue;
      try {
        await conn.execute(stmt);
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME' || err.message.includes('already exists')) {
          console.log(`  Skipped (already exists): ${stmt.substring(0, 60)}...`);
        } else {
          console.error(`  ERROR in ${file}: ${err.message}`);
          console.error(`  Statement: ${stmt.substring(0, 100)}`);
        }
      }
    }
    console.log(`  Done: ${file}`);
  }

  // Verify tables created
  const [tables] = await conn.execute('SHOW TABLES');
  console.log(`\n✅ Migration complete! ${tables.length} tables created:`);
  tables.forEach(t => console.log(' -', Object.values(t)[0]));

  await conn.end();
}

runMigrations().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
