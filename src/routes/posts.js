const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /posts — fetch all posts (with author name via JOIN)
router.get("/", async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id, p.title, p.body, p.created_at, u.name AS author
       FROM posts p
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
    );
    res.json({ posts: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// GET /posts/:id — fetch single post
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  try {
    const result = await db.query(
      `SELECT p.id, p.title, p.body, p.created_at, u.name AS author
       FROM posts p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// POST /posts — create a new post
router.post("/", async (req, res) => {
  const { title, body, user_id } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!body || typeof body !== "string" || body.trim() === "") {
    return res.status(400).json({ error: "Body is required" });
  }
  if (!user_id || !Number.isInteger(Number(user_id))) {
    return res.status(400).json({ error: "Valid user_id is required" });
  }

  try {
    const result = await db.query(
      "INSERT INTO posts (title, body, user_id) VALUES ($1, $2, $3) RETURNING id, title, body, user_id, created_at",
      [title.trim(), body.trim(), user_id]
    );
    res.status(201).json({ post: result.rows[0] });
  } catch (err) {
    // Foreign key violation — user_id doesn't exist
    if (err.code === "23503") {
      return res.status(400).json({ error: "User does not exist" });
    }
    res.status(500).json({ error: "Failed to create post" });
  }
});

module.exports = router;
