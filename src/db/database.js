import * as SQLite from 'expo-sqlite';


export const initializeDatabase = async (db) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS color_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT NOT NULL,
        color TEXT NOT NULL,
        action TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS mistakes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        question TEXT,
        solution TEXT,
        image_uri TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_exported INTEGER DEFAULT 0
      );
    `);
    
    // Safety check: Alter table to add is_exported if upgrading from old version
    try {
      await db.execAsync(`ALTER TABLE mistakes ADD COLUMN is_exported INTEGER DEFAULT 0;`);
      console.log("Added is_exported column to existing mistakes table");
    } catch (e) {
      // Column might already exist, ignore
    }

    console.log("Database initialized successfully via Provider");
  } catch (error) {
    console.error("Database initialization failed", error);
  }
};

// CRUD for color rules
export const getColorRules = async (db) => {
  return await db.getAllAsync('SELECT * FROM color_rules');
};

export const addColorRule = async (db, subject, color, action) => {
  const result = await db.runAsync(
    'INSERT INTO color_rules (subject, color, action) VALUES (?, ?, ?)',
    subject, color, action
  );
  return result.lastInsertRowId;
};

export const deleteColorRule = async (db, id) => {
  await db.runAsync('DELETE FROM color_rules WHERE id = ?', id);
};

// CRUD for mistakes
export const addMistake = async (db, subject, question, solution, imageUri) => {
  const result = await db.runAsync(
    'INSERT INTO mistakes (subject, question, solution, image_uri) VALUES (?, ?, ?, ?)',
    subject, question, solution, imageUri
  );
  return result.lastInsertRowId;
};

export const getMistakes = async (db) => {
  return await db.getAllAsync('SELECT * FROM mistakes ORDER BY created_at DESC');
};

export const updateMistakeSolution = async (db, id, newSolution) => {
  await db.runAsync('UPDATE mistakes SET solution = ? WHERE id = ?', newSolution, id);
};

export const deleteMistakes = async (db, ids) => {
  if (!ids || ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`DELETE FROM mistakes WHERE id IN (${placeholders})`, ...ids);
};

export const markMistakesAsExported = async (db, ids) => {
  if (!ids || ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE mistakes SET is_exported = 1 WHERE id IN (${placeholders})`, ...ids);
};
