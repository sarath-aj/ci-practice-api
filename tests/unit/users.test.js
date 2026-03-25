// Unit tests — these test pure logic in ISOLATION.
// No database, no HTTP calls. Fast and cheap to run.
// We mock the db module so routes can be tested without a real DB.

const request = require("supertest");
const app = require("../../src/app");

// Mock the entire db module — Jest replaces it with auto-mocked stubs.
// This means NO real DB connection is needed for unit tests.
jest.mock("../../src/db");
const db = require("../../src/db");

describe("Users Route - Unit Tests", () => {
  // Reset all mocks between tests to avoid bleed-through
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /users ────────────────────────────────────────────────────────────

  describe("GET /users", () => {
    it("should return 200 with list of users", async () => {
      // Arrange — tell the mock what the DB would return
      db.query.mockResolvedValue({
        rows: [
          { id: 1, name: "Sarath", email: "sarath@example.com", created_at: new Date() },
        ],
      });

      // Act
      const res = await request(app).get("/users");

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0].name).toBe("Sarath");
    });

    it("should return 500 when DB throws", async () => {
      db.query.mockRejectedValue(new Error("DB connection failed"));

      const res = await request(app).get("/users");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Failed to fetch users");
    });
  });

  // ─── GET /users/:id ────────────────────────────────────────────────────────

  describe("GET /users/:id", () => {
    it("should return 200 with user when found", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, name: "Sarath", email: "sarath@example.com", created_at: new Date() }],
      });

      const res = await request(app).get("/users/1");

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(1);
    });

    it("should return 404 when user not found", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const res = await request(app).get("/users/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should return 400 for invalid ID format", async () => {
      const res = await request(app).get("/users/abc");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid user ID");
      // DB should never be called for invalid input — fail fast
      expect(db.query).not.toHaveBeenCalled();
    });
  });

  // ─── POST /users ───────────────────────────────────────────────────────────

  describe("POST /users", () => {
    it("should return 201 and created user on success", async () => {
      db.query.mockResolvedValue({
        rows: [{ id: 1, name: "Sarath", email: "sarath@example.com", created_at: new Date() }],
      });

      const res = await request(app)
        .post("/users")
        .send({ name: "Sarath", email: "sarath@example.com" });

      expect(res.status).toBe(201);
      expect(res.body.user.name).toBe("Sarath");
    });

    it("should return 400 when name is missing", async () => {
      const res = await request(app)
        .post("/users")
        .send({ email: "sarath@example.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Name is required");
    });

    it("should return 400 when email is invalid", async () => {
      const res = await request(app)
        .post("/users")
        .send({ name: "Sarath", email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Valid email is required");
    });

    it("should return 409 when email already exists", async () => {
      const duplicateError = new Error("duplicate key");
      duplicateError.code = "23505"; // PostgreSQL unique violation
      db.query.mockRejectedValue(duplicateError);

      const res = await request(app)
        .post("/users")
        .send({ name: "Sarath", email: "sarath@example.com" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email already exists");
    });
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("should return 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Unknown route", () => {
  it("should return 404", async () => {
    const res = await request(app).get("/nonexistent");
    expect(res.status).toBe(404);
  });
});
