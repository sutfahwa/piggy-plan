/* ============================================================
   sqlite.js — Local SQLite storage for testing.
   Used when in DEV mode to mock cloud persistence.
   ============================================================ */
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db = null;

const PREFIX = 'finplan:';

// Map localStorage keys to feature tables
const FEATURE_MAP = {
  'profile': 'profile',
  'ot': 'ot',
  'plan': 'plan',
  'tax': 'tax',
  'pvd': 'pvd',
  'savings': 'savings',
};

export async function initSQLite() {
  if (db) return db;
  try {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      // Create jeep-sqlite if it doesn't exist
      let jeep = document.querySelector('jeep-sqlite');
      if (!jeep) {
        jeep = document.createElement('jeep-sqlite');
        document.body.appendChild(jeep);
      }
      await customElements.whenDefined('jeep-sqlite');
      
      // Initialize jeep-sqlite
      const isInitial = await sqlite.isJsonListeners();
      if (!isInitial) {
        await sqlite.initWebStore();
      }
    }

    db = await sqlite.createConnection('piggyplan_local', false, 'no-encryption', 1, false);
    await db.open();

    // Create tables
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        provider TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS profile (user_id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS ot (user_id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS plan (user_id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS tax (user_id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS pvd (user_id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS savings (user_id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS other_data (user_id TEXT, key TEXT, data TEXT, PRIMARY KEY (user_id, key));
    `;
    
    // SQLiteConnection execute doesn't support multiple statements in one call easily in some versions,
    // but the community plugin usually does. Let's split just in case or use execute.
    await db.execute(schema);
    console.log('SQLite: Database initialized');
    return db;
  } catch (e) {
    console.error('SQLite: Initialization failed', e);
    return null;
  }
}

export async function saveToSQLite(uid, snapshot) {
  if (!db) await initSQLite();
  if (!db) return;

  try {
    // Group snapshot by feature
    const grouped = {};
    Object.entries(snapshot).forEach(([k, v]) => {
      const key = k.startsWith(PREFIX) ? k.slice(PREFIX.length) : k;
      const part = key.split('.')[0];
      const table = FEATURE_MAP[part];
      if (table) {
        if (!grouped[table]) grouped[table] = {};
        grouped[table][key] = v;
      } else {
        if (!grouped['other_data']) grouped['other_data'] = {};
        grouped['other_data'][key] = v;
      }
    });

    // Save each group
    for (const [table, data] of Object.entries(grouped)) {
      if (table === 'other_data') {
        for (const [key, val] of Object.entries(data)) {
          await db.run(`INSERT OR REPLACE INTO other_data (user_id, key, data) VALUES (?, ?, ?)`, [uid, key, val]);
        }
      } else {
        await db.run(`INSERT OR REPLACE INTO ${table} (user_id, data) VALUES (?, ?)`, [uid, JSON.stringify(data)]);
      }
    }
    
    // Update user info if it's in the snapshot (usually in profile)
    if (snapshot[PREFIX + 'profile']) {
      const prof = JSON.parse(snapshot[PREFIX + 'profile']);
      await db.run(`INSERT OR REPLACE INTO users (uid, email, name, provider) VALUES (?, ?, ?, ?)`, 
        [uid, prof.email || '', prof.name || '', prof.provider || '']);
    }

    if (Capacitor.getPlatform() === 'web') {
      await sqlite.saveToStore('piggyplan_local');
    }
  } catch (e) {
    console.error('SQLite: Save failed', e);
  }
}

export async function hydrateFromSQLite(uid) {
  if (!db) await initSQLite();
  if (!db) return {};

  const out = {};
  try {
    const tables = Object.values(FEATURE_MAP).concat(['other_data']);
    
    for (const table of tables) {
      if (table === 'other_data') {
        const res = await db.query(`SELECT key, data FROM other_data WHERE user_id = ?`, [uid]);
        res.values?.forEach(row => {
          out[PREFIX + row.key] = row.data;
        });
      } else {
        const res = await db.query(`SELECT data FROM ${table} WHERE user_id = ?`, [uid]);
        if (res.values?.length > 0) {
          const data = JSON.parse(res.values[0].data);
          Object.entries(data).forEach(([k, v]) => {
            out[PREFIX + k] = v;
          });
        }
      }
    }
    return out;
  } catch (e) {
    console.error('SQLite: Hydrate failed', e);
    return {};
  }
}
