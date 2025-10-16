import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  reporter: "html",
  use: {
    trace: "on-first-retry",
  },
});
