import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "build",
  bundle: true,
  noExternal: [/.*/],
  minify: false,
  sourcemap: false,
  clean: true,
});
