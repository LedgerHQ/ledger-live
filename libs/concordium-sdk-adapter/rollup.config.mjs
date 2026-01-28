import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";

/**
 * Creates a bundle configuration for a given entry point
 * @param {string} input - Entry point file path
 * @param {string} outputFile - Output file path (relative to lib/lib-es)
 * @param {import('rollup').RollupOptions} config
 * @returns {import('rollup').RollupOptions}
 */
const createBundle = (input, outputFile, config = {}) => ({
  ...config,
  input,
  output: [
    {
      file: `lib/${outputFile.replace(/\.js$/, ".cjs")}`,
      format: "cjs",
    },
    {
      file: `lib-es/${outputFile}`,
      format: "es",
    },
  ],
});

/**
 * Creates a type-only bundle configuration
 * @param {string} input - Entry point file path
 * @param {string} outputFile - Output file path
 * @returns {import('rollup').RollupOptions}
 */
const createTypeBundle = (input, outputFile) => ({
  input,
  plugins: [dts()],
  output: {
    file: outputFile,
    format: "es", // dts plugin handles the format mostly, but 'es' is standard for decls
  },
});

export default [
  createBundle("src/index.ts", "index.js", {
    plugins: [resolve({ preferBuiltins: false }), commonjs(), esbuild()],
  }),
  // Type definitions for runtime entry point (ESM)
  createTypeBundle("src/index.ts", "lib-es/index.d.ts"),
  // Type definitions for runtime entry point (CJS)
  createTypeBundle("src/index.ts", "lib/index.d.cts"),
  // Type-only entry point (ESM)
  createTypeBundle("src/types/index.ts", "lib-es/types/index.d.ts"),
  // Type-only entry point (CJS)
  createTypeBundle("src/types/index.ts", "lib/types/index.d.cts"),
];
