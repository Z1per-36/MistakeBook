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
        answer TEXT,
        solution TEXT,
        image_uri TEXT,
        needs_image INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_exported INTEGER DEFAULT 0
      );
    `);
    // Safety check: Alter table to add is_exported if upgrading from old version
    const tableInfo = await db.getAllAsync(`PRAGMA table_info(mistakes)`);
    const hasIsExported = tableInfo.some(column => column.name === 'is_exported');
    if (!hasIsExported) {
      await db.execAsync(`ALTER TABLE mistakes ADD COLUMN is_exported INTEGER DEFAULT 0;`);
      console.log("Added is_exported column to existing mistakes table");
    }

    const hasAnswer = tableInfo.some(column => column.name === 'answer');
    if (!hasAnswer) {
      await db.execAsync(`ALTER TABLE mistakes ADD COLUMN answer TEXT;`);
      console.log("Added answer column to existing mistakes table");
    }

    const hasNeedsImage = tableInfo.some(column => column.name === 'needs_image');
    if (!hasNeedsImage) {
      await db.execAsync(`ALTER TABLE mistakes ADD COLUMN needs_image INTEGER DEFAULT 0;`);
      console.log("Added needs_image column to existing mistakes table");
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
export const addMistake = async (db, subject, question, answer, solution, imageUri, needsImage = 0) => {
  const result = await db.runAsync(
    'INSERT INTO mistakes (subject, question, answer, solution, image_uri, needs_image) VALUES (?, ?, ?, ?, ?, ?)',
    subject, question, answer, solution, imageUri, needsImage ? 1 : 0
  );
  return result.lastInsertRowId;
};

export const getMistakes = async (db) => {
  return await db.getAllAsync('SELECT * FROM mistakes ORDER BY created_at DESC');
};

export const updateMistakeSolution = async (db, id, newSolution) => {
  await db.runAsync('UPDATE mistakes SET solution = ? WHERE id = ?', newSolution, id);
};

export const updateMistakeDetails = async (db, id, subject, question, answer, solution, needsImage) => {
  await db.runAsync(
    'UPDATE mistakes SET subject = ?, question = ?, answer = ?, solution = ?, needs_image = ? WHERE id = ?', 
    subject, question, answer, solution, needsImage ? 1 : 0, id
  );
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
