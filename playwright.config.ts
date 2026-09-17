import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:8080",
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
});
