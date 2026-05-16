import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dossierDb = join(__dirname, '../../data');
const cheminDb = join(dossierDb, 'tickets.db');

if (!fs.existsSync(dossierDb)) {
    fs.mkdirSync(dossierDb, { recursive: true });
}

const db = new Database(cheminDb);

db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT UNIQUE,
        user_id TEXT NOT NULL,
        channel_id TEXT UNIQUE,
        category TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'Normal',
        claimed_by TEXT,
        subject TEXT,
        description TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        first_response_at DATETIME,
        closed_at DATETIME,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_dm BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS canned_responses (
        name TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blacklist (
        user_id TEXT PRIMARY KEY,
        reason TEXT,
        staff_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
`);

export default db;
