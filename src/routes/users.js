const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /users — fetch all users
router.get("/", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /users/:id — fetch single user
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Basic validation — id must be a positive integer
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const result = await db.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// POST /users — create a new user
router.post("/", async (req, res) => {
  const { name, email } = req.body;

  // Input validation — required fields
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  try {
    const result = await db.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at",
      [name.trim(), email.trim().toLowerCase()]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    // PostgreSQL unique violation error code
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

module.exports = router;
