import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'ats.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    position INTEGER NOT NULL,
    is_terminal INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    skills TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    stage_id INTEGER NOT NULL REFERENCES stages(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(stage_id);
  CREATE INDEX IF NOT EXISTS idx_activities_candidate ON activities(candidate_id);
`);

export const STAGES = [
  { name: 'Applied', position: 1, is_terminal: 0 },
  { name: 'Screening', position: 2, is_terminal: 0 },
  { name: 'Interview', position: 3, is_terminal: 0 },
  { name: 'Offer', position: 4, is_terminal: 0 },
  { name: 'Hired', position: 5, is_terminal: 1 },
  { name: 'Rejected', position: 6, is_terminal: 1 },
];

export function ensureStages() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM stages').get().c;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO stages (name, position, is_terminal) VALUES (?, ?, ?)');
    for (const s of STAGES) insert.run(s.name, s.position, s.is_terminal);
  }
}

ensureStages();
