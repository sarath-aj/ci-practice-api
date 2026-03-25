// Integration test helper — runs before/after the test suite
// to set up and tear down a real PostgreSQL schema.
//
// In CI, the DB is the service container defined in the workflow YAML.
// Locally, you need a running Postgres instance with matching env vars.

const db = require("../../src/db");

// Creates the tables fresh before the integration test suite runs.
// We DROP first to ensure a clean slate on every CI run.
const setupDatabase = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      email      VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id         SERIAL PRIMARY KEY,
      title      VARCHAR(255) NOT NULL,
      body       TEXT NOT NULL,
      user_id    INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

// Truncates all data between tests so each test starts clean.
// RESTART IDENTITY resets auto-increment sequences (id starts at 1 again).
// CASCADE handles foreign key dependencies automatically.
const clearDatabase = async () => {
  await db.query("TRUNCATE TABLE posts, users RESTART IDENTITY CASCADE");
};

// Close the DB pool after all tests finish.
// Without this, Jest hangs waiting for open handles.
const teardownDatabase = async () => {
  await db.end();
};

module.exports = { setupDatabase, clearDatabase, teardownDatabase };
