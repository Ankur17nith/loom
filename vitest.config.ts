import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "apps/dashboard/src/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    restoreMocks: true,
    clearMocks: true,
    passWithNoTests: false,
  },
});
