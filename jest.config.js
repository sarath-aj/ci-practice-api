module.exports = {
  // Run tests in Node environment (not browser)
  testEnvironment: "node",

  // Coverage settings — in CI we enforce these thresholds.
  // If coverage drops below these numbers, the CI job FAILS.
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Where to collect coverage from
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"],

  // Output formats: text (terminal) + lcov (for uploading as artifact)
  coverageReporters: ["text", "lcov", "html"],

  // Coverage output directory
  coverageDirectory: "coverage",

  // Timeout for integration tests hitting a real DB
  testTimeout: 15000,
};
