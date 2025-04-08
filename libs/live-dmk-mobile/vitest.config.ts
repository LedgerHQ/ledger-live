import { defineConfig } from "vitest/config";
import reactPlugin from "@vitejs/plugin-react";

export default defineConfig({
  // @ts-expect-error typescript is being craycray
  plugins: [reactPlugin()],
  test: {
    globals: true,
    exclude: ["node_modules", "lib-es"],
    silent: false,
    setupFiles: ["./tests.setup.ts"],
    include: ["src/**/*.test.*"],
    environment: "jsdom",
    printConsoleTrace: true,
    coverage: {
      enabled: true,
      provider: "istanbul",
      reporter: ["text", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["node_modules", "lib-es", "src/hooks/index.ts", "src/index.ts", "src/**/*.test.*"],
    },
  },
});
