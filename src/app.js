const express = require("express");
const app = express();

// Parse incoming JSON bodies
app.use(express.json());

// Routes
app.use("/users", require("./routes/users"));
app.use("/posts", require("./routes/posts"));

// Health check endpoint — used by Docker, K8s, and GitHub Actions
// service container health checks
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: process.env.npm_package_version || "1.0.0" });
});

// 404 handler — catches any unmatched route
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler — catches errors thrown by route handlers
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// NOTE: We export the app WITHOUT calling app.listen() here.
// This is a critical pattern for testability — supertest can
// start the app on a random port without port conflicts.
module.exports = app;
