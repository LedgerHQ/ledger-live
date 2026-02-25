import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, "lib");
const entryFile = path.resolve(__dirname, "src", "index.ts");

const swcRule = {
  test: /\.ts$/,
  exclude: /node_modules/,
  loader: "builtin:swc-loader",
  options: {
    jsc: {
      parser: {
        syntax: "typescript",
      },
      target: "es2020",
    },
  },
  type: "javascript/auto",
};

const baseConfig = {
  context: __dirname,
  entry: {
    "ethereum-provider": entryFile,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [swcRule],
  },
  target: "web",
  optimization: {
    minimize: false,
  },
  stats: "errors-warnings",
};

export default [
  {
    ...baseConfig,
    name: "cjs",
    output: {
      path: outputDir,
      filename: "ethereum-provider.js",
      library: {
        type: "commonjs2",
      },
    },
  },
  {
    ...baseConfig,
    name: "esm",
    experiments: {
      outputModule: true,
    },
    output: {
      path: outputDir,
      filename: "ethereum-provider.mjs",
      library: {
        type: "module",
      },
    },
  },
  {
    ...baseConfig,
    name: "umd",
    output: {
      path: outputDir,
      filename: "ethereum-provider.umd.js",
      library: {
        name: "LedgerLiveEthereumProvider",
        type: "umd",
      },
    },
  },
];
