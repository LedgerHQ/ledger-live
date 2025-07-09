import { defineConfig } from "vitest/config";
import reactPlugin from "@vitejs/plugin-react";

export default defineConfig({
  // @ts-expect-error typescript is being craycray
  plugins: [reactPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests.setup.ts"],
    exclude: ["node_modules", "lib-es"],
    silent: false,
    include: ["src/**/*.test.*"],
    printConsoleTrace: true,
    coverage: {
      enabled: true,
      provider: "istanbul",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["node_modules", "lib-es", "src/hooks/index.ts", "src/index.ts", "src/**/*.test.*"],
    },
  },
});
