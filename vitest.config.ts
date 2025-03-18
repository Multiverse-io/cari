import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@test": resolve(__dirname, "./src/__test__"),
      "~": resolve(__dirname, "./src"),
    },
  },
});
