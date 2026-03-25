module.exports = {
  // Run tests in Node environment (not browser)
  testEnvironment: "node",

  // Coverage settings — in CI we enforce these thresholds.
  // If coverage drops below these numbers, the CI job FAILS.
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 40,
      lines: 60,
      statements: 60
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
