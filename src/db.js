const { Pool } = require("pg");

// pg Pool manages a pool of PostgreSQL connections.
// In CI, these env vars are injected from GitHub Actions secrets/env.
// Locally, set them in a .env file (never commit .env to git).
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "ci_practice",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",

  // Keep connection pool small in test environments
  max: process.env.NODE_ENV === "test" ? 5 : 20,

  // Timeout so tests don't hang forever if DB is unreachable
  connectionTimeoutMillis: 5000,
});

// A simple query wrapper used throughout the app
const query = (text, params) => pool.query(text, params);

// Graceful shutdown — called when the app exits
const end = () => pool.end();

module.exports = { query, end, pool };
