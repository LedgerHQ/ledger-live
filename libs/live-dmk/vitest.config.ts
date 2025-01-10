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
    printConsoleTrace: true,
  },
});
