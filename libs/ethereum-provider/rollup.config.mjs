import { createRequire } from "node:module";
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

/**
 * @param {import('rollup').RollupOptions} config
 * @returns {import('rollup').RollupOptions}
 */
const bundle = config => ({
  ...config,
  input: "src/index.ts",
});

/**
 * Plugin used to generate a json containing the UMD code
 * for use with the react-native-webview package
 * @returns {import('rollup').Plugin}
 */
function UMDtoJSON() {
  return {
    name: "UMDtoJSON",
    renderChunk(code, chunk, options) {
      if (options.format === "umd") {
        return {
          code: JSON.stringify({ code }),
        };
      }
    },
  };
}

export default [
  bundle({
    plugins: [resolve({ preferBuiltins: false }), commonjs(), esbuild(), UMDtoJSON()],
    output: [
      {
        file: pkg.main,
        format: "cjs",
      },
      {
        file: pkg.module,
        format: "es",
      },
      {
        name: "LedgerLiveEthereumProvider",
        file: pkg.browser,
        format: "umd",
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: pkg.types,
      format: "es",
    },
  }),
];
