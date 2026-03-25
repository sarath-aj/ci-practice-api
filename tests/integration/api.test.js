// Integration tests — these hit a REAL PostgreSQL database.
// They test the full stack: HTTP → Express → pg → PostgreSQL.
// In CI, Postgres runs as a service container (see ci.yml).
// These are slower than unit tests but catch real DB interaction bugs.

const request = require("supertest");
const app = require("../../src/app");
const { setupDatabase, clearDatabase, teardownDatabase } = require("./setup");

// Run once before all tests in this file
beforeAll(async () => {
  await setupDatabase();
});

// Clean data between each test — isolation is crucial
beforeEach(async () => {
  await clearDatabase();
});

// Close DB pool when done — prevents Jest open handle warning
afterAll(async () => {
  await teardownDatabase();
});

// ─── Users Integration ────────────────────────────────────────────────────────

describe("Users API - Integration", () => {
  describe("POST /users", () => {
    it("should create a user in the real DB", async () => {
      const res = await request(app)
        .post("/users")
        .send({ name: "Sarath", email: "sarath@example.com" });

      expect(res.status).toBe(201);
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.email).toBe("sarath@example.com");
    });

    it("should reject duplicate emails at the DB level", async () => {
      // Create user once
      await request(app)
        .post("/users")
        .send({ name: "Sarath", email: "sarath@example.com" });

      // Try to create again with same email — DB unique constraint fires
      const res = await request(app)
        .post("/users")
        .send({ name: "Sarath 2", email: "sarath@example.com" });

      expect(res.status).toBe(409);
    });
  });

  describe("GET /users", () => {
    it("should return all users from the real DB", async () => {
      // Seed data
      await request(app).post("/users").send({ name: "Alice", email: "alice@example.com" });
      await request(app).post("/users").send({ name: "Bob", email: "bob@example.com" });

      const res = await request(app).get("/users");

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(2);
    });

    it("should return empty array when no users exist", async () => {
      const res = await request(app).get("/users");

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(0);
    });
  });

  describe("GET /users/:id", () => {
    it("should return the correct user by ID", async () => {
      // Create and grab the returned ID
      const created = await request(app)
        .post("/users")
        .send({ name: "Sarath", email: "sarath@example.com" });

      const userId = created.body.user.id;

      const res = await request(app).get(`/users/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Sarath");
    });

    it("should return 404 for non-existent ID", async () => {
      const res = await request(app).get("/users/9999");
      expect(res.status).toBe(404);
    });
  });
});

// ─── Posts Integration ────────────────────────────────────────────────────────

describe("Posts API - Integration", () => {
  // We need a user to attach posts to (FK constraint)
  let testUserId;

  beforeEach(async () => {
    const res = await request(app)
      .post("/users")
      .send({ name: "Test Author", email: "author@example.com" });
    testUserId = res.body.user.id;
  });

  describe("POST /posts", () => {
    it("should create a post linked to a real user", async () => {
      const res = await request(app).post("/posts").send({
        title: "My First Post",
        body: "Hello from integration tests",
        user_id: testUserId,
      });

      expect(res.status).toBe(201);
      expect(res.body.post.title).toBe("My First Post");
      expect(res.body.post.user_id).toBe(testUserId);
    });

    it("should reject post with non-existent user_id (FK constraint)", async () => {
      const res = await request(app).post("/posts").send({
        title: "Orphan Post",
        body: "This user doesnt exist",
        user_id: 99999,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("User does not exist");
    });
  });

  describe("GET /posts", () => {
    it("should return posts with author name via JOIN", async () => {
      await request(app).post("/posts").send({
        title: "Test Post",
        body: "Body content",
        user_id: testUserId,
      });

      const res = await request(app).get("/posts");

      expect(res.status).toBe(200);
      expect(res.body.posts[0].author).toBe("Test Author");
    });
  });
});
