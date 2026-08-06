import path from "path";
import { rspack, type RspackOptions } from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";
import { commonConfig, rootFolder } from "./rspack.common";
import {
  buildRendererEnv,
  buildDotEnvDefine,
  DOTENV_FILE,
  lldRoot,
  getRsdoctorPlugin,
  isRsdoctorEnabled,
} from "./utils";

/**
 * Creates the rspack configuration for the Electron renderer process
 */
// Supplies the `process.*` stand-ins the DefinePlugin entries below rewrite reads to.
const rendererProcessShim = path.resolve(rootFolder, "src", "renderer", "bootstrap", "process.ts");

export function createRendererConfig(
  mode: "development" | "production",
  options?: { devServer?: boolean },
): RspackOptions {
  const isDev = mode === "development";
  const useDevServer = options?.devServer ?? isDev;

  // Ensure single instance of styled-components (avoid theme context issues)
  const styledComponentsPath = require.resolve("styled-components");

  return {
    ...commonConfig,
    name: "renderer",
    mode,
    // The renderer has no Node access under contextIsolation, so it is built as an ordinary
    // web target. "es2022" pins output.environment explicitly — with no browserslist config
    // a bare "web" target falls back to conservative codegen. Electron 43 ships Chromium 150.
    target: ["web", "es2022"],
    entry: {
      // The process shim must run before the application's first module: many modules read
      // process.env at module scope, and DefinePlugin rewrites those reads to globals this
      // module assigns.
      renderer: [rendererProcessShim, path.resolve(rootFolder, "src", "renderer", "index.ts")],
    },
    output: {
      ...commonConfig.output,
      filename: "renderer.bundle.js",
      // The chunk-loading runtime otherwise emits `global[...]`, because electron-renderer
      // is a Node-ish target. `global` does not exist in the renderer's main world once
      // contextIsolation is on, so the very first chunk load throws
      // "ReferenceError: global is not defined". DefinePlugin cannot fix this — it does not
      // rewrite the bundler's own runtime.
      globalObject: "globalThis",
      publicPath: isDev ? "/" : "./",
      assetModuleFilename: "assets/[name]-[hash][ext]",
    },
    devtool: isRsdoctorEnabled() ? false : isDev ? "eval-source-map" : "source-map",
    resolve: {
      ...commonConfig.resolve,
      // Platform-specific file resolution:
      // .web.tsx/.web.ts are resolved first for desktop platform
      // This enables shared features packages with .web and .native variants
      extensions: process.env.V3
        ? [
            ".v3.tsx",
            ".v3.ts",
            ".web.tsx",
            ".web.ts",
            ".tsx",
            ".ts",
            ".js",
            ".jsx",
            ".json",
            ".lottie",
          ]
        : [
            ".web.tsx",
            ".web.ts",
            ".tsx",
            ".ts",
            ".v3.tsx",
            ".v3.ts",
            ".js",
            ".jsx",
            ".json",
            ".lottie",
          ],
      mainFields: ["browser", "module", "main"],
      // Honour package.json `browser` field *object* mappings, e.g. {"crypto": false}.
      // mainFields only covers the string form; without this, packages that ship a browser
      // build keep resolving their Node entry and drag builtins back in.
      aliasFields: ["browser"],
      // Node builtins the dependency tree still reaches for. Deliberately explicit rather
      // than a blanket polyfill plugin: each entry that is actually used is a bundle-size
      // regression worth seeing in review.
      //
      // `crypto` maps to crypto-browserify only because an audit showed the libs use just
      // randomBytes/createHash/createHmac/createSign. It has NO AES-GCM (browserify-cipher
      // omits it), so if a GCM user is ever reintroduced this will build green and throw at
      // runtime — that is why hw-ledger-key-ring-protocol was moved to @noble instead.
      //
      // `os` is deliberately absent: os-browserify reports type() === "Browser" and an empty
      // hostname(), which would silently mislabel the Ledger Sync instance name.
      fallback: {
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("readable-stream"),
        string_decoder: require.resolve("string_decoder/"),
        url: require.resolve("url/"),
        querystring: require.resolve("querystring-es3"),
        path: require.resolve("path-browserify"),
        util: require.resolve("util/"),
        assert: require.resolve("assert/"),
        buffer: require.resolve("buffer/"),
        // Unreachable in a browser build: live-network gates its keep-alive agent on
        // process.release, which is defined away above.
        http: false,
        https: false,
        net: false,
        tls: false,
        zlib: false,
        fs: false,
        child_process: false,
      },
      // Don't require file extensions in imports for ESM modules
      fullySpecified: false,
      // Module resolution paths - needed for features folder to find react, etc.
      modules: [
        path.resolve(lldRoot, "node_modules"),
        path.resolve(lldRoot, "..", "..", "node_modules"),
        "node_modules",
      ],
      alias: {
        ...commonConfig.resolve?.alias,
        LLD: path.resolve(lldRoot, "src", "mvvm"),
        "styled-components": styledComponentsPath,
        // Route `ZCash` to the IPC client in the renderer so the `zcash-utils`
        // .node addon stays out of the bundle: it is hosted in a UtilityProcess,
        // reached over the `zcash:*` channels the main process registers (see
        // `@ledgerhq/coin-zcash/network/ipc/main-host`).
        "@ledgerhq/coin-zcash/network/ZCash$": "@ledgerhq/coin-zcash/network/ZCashIPC",
        // Fix tests/time.js import for TIMEMACHINE feature
        "../../tests/time.js": path.resolve(rootFolder, "tests", "time.ts"),
        "../tests/time": path.resolve(rootFolder, "tests", "time.ts"),
        // NB icon-sdk-js was aliased to its .node.min.js build for bundle size. That build
        // pulls in net, tls, os, http, https, util and zlib, so it resolves to its browser
        // entry again under a web target. Costs size; correctness wins.
        // @stellar/stellar-sdk: browser field is dist/stellar-sdk.min.js (915KB), main is lib/index.js (smaller, tree-shakeable)
        "@stellar/stellar-sdk": path.resolve(
          rootFolder,
          "..",
          "..",
          "node_modules",
          ".pnpm",
          "@stellar+stellar-sdk@14.0.0",
          "node_modules",
          "@stellar",
          "stellar-sdk",
          "lib",
          "index.js",
        ),
        // casper-js-sdk: browser field is dist/lib.web.js (1MB), main is dist/lib.node.js (smaller)
        "casper-js-sdk": path.resolve(
          rootFolder,
          "..",
          "..",
          "node_modules",
          ".pnpm",
          "casper-js-sdk@5.0.5",
          "node_modules",
          "casper-js-sdk",
          "dist",
          "lib.node.js",
        ),
        // web3: browser field is dist/web3.min.js (1.3MB UMD), main is lib/index.js (tree-shakeable)
        // LIVE-23059: long term solution is to get rid of this deprecated lib
        web3: path.resolve(
          rootFolder,
          "..",
          "..",
          "node_modules",
          ".pnpm",
          "web3@1.10.4",
          "node_modules",
          "web3",
          "lib",
          "index.js",
        ),
        // Deduplicate @scure/bip39: multiple versions (1.x from cosmos/casper/filecoin, 2.x from @mysten/sui).
        // The path pins an exact version, so a @mysten/sui bump that moves its 2.x needs it updated.
        // V2 is backward-compatible and shares @noble/hashes@2.x already in the bundle
        "@scure/bip39": path.resolve(
          rootFolder,
          "..",
          "..",
          "node_modules",
          ".pnpm",
          "@scure+bip39@2.3.0",
          "node_modules",
          "@scure",
          "bip39",
        ),
      },
    },
    // Ignore specific warnings from polkadot packages
    ignoreWarnings: [/Critical dependency: Accessing import\.meta directly/],
    module: {
      rules: [
        // Fix for ESM modules that don't have file extensions
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
        // TypeScript/JavaScript with React support
        {
          test: /\.(ts|tsx)$/,
          include: [
            path.resolve(lldRoot, "src"),
            path.resolve(lldRoot, "tests"),
            path.resolve(lldRoot, "tools"),
            path.resolve(lldRoot, "..", "..", "features"),
            path.resolve(lldRoot, "..", "..", "shared"),
            path.resolve(lldRoot, "..", "..", "devtools"),
            path.resolve(lldRoot, "..", "..", "domain"),
          ],
          exclude: /node_modules/,
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                  development: isDev,
                  refresh: useDevServer,
                },
              },
              // Target ES2020 to preserve BigInt and other modern features
              target: "es2020",
            },
          },
          type: "javascript/auto",
        },
        {
          test: /\.(js|jsx)$/,
          // Exclude node_modules AND already-compiled lib/lib-es directories from workspace packages
          exclude: [/node_modules/, /lib-es/, /\/lib\//],
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "ecmascript",
                jsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                  development: isDev,
                  refresh: useDevServer,
                },
              },
              // Target ES2020 to preserve BigInt and other modern features
              target: "es2020",
            },
          },
          type: "javascript/auto",
        },
        // CSS - using PostCSS for Tailwind CSS processing
        {
          test: /\.css$/,
          use: ["postcss-loader"],
          type: "css/auto",
        },
        // Font files
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name]-[hash][ext]",
          },
        },
        // Media files
        {
          test: /\.(webm|mp4)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name]-[hash][ext]",
          },
        },
        // Image files
        {
          test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name]-[hash][ext]",
          },
        },
        // .lottie files (dotLottie) - emit as asset, import returns URL
        {
          test: /\.lottie$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name]-[hash][ext]",
          },
        },
      ],
    },
    plugins: [
      ...getRsdoctorPlugin("renderer"),
      new rspack.DefinePlugin({
        ...buildRendererEnv(mode),
        ...buildDotEnvDefine(DOTENV_FILE),
        // A context-isolated renderer has no `process`. These reads are rewritten to
        // globals assigned by src/renderer/bootstrap/process.ts, which is prepended to the
        // entry so it runs before the application's first module.
        //
        // ProvidePlugin cannot be used for this: it only rewrites free variables it sees
        // while parsing source, and these identifiers are introduced by DefinePlugin
        // afterwards, so it never observes them.
        //
        // Note the more specific keys above (process.env.NODE_ENV and the dotenv entries)
        // still win for those exact expressions; this only catches everything else.
        "process.env": "globalThis.__LLD_PROCESS_ENV__",
        "process.platform": "globalThis.__LLD_PROCESS_PLATFORM__",
        "process.mas": "globalThis.__LLD_PROCESS_MAS__",
        "process.windowsStore": "globalThis.__LLD_PROCESS_WINDOWS_STORE__",
        "process.type": JSON.stringify("renderer"),
        // Deliberately undefined, not merely absent: libs/live-network gates a
        // `require("https")` keep-alive agent on `process.release?.name === "node"`.
        // Defining it away removes that branch from a browser-shaped bundle.
        "process.release": "undefined",
        // Third-party code reaching for the Node `global`. Only aliased `window` because
        // nodeIntegration was on; it does not exist under contextIsolation.
        global: "globalThis",
      }),
      // `Buffer` is a Node global that the coin/crypto stack uses as a free variable in
      // hundreds of places. Unlike the DefinePlugin-introduced identifiers above,
      // ProvidePlugin works here: it rewrites free variables it sees while parsing source,
      // and `Buffer` genuinely is one.
      new rspack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      }),
      new rspack.HtmlRspackPlugin({
        template: path.resolve(rootFolder, "src", "renderer", "index.html"),
        filename: "index.html",
        title: "Ledger Wallet",
        inject: "body",
        scriptLoading: "defer",
      }),
      // React Fast Refresh for development
      ...(useDevServer ? [new ReactRefreshRspackPlugin()] : []),
    ],
    optimization: {
      minimize: !isDev,
    },
    stats: isDev ? "errors-warnings" : "normal",
    experiments: {
      css: true,
    },
  };
}

export default createRendererConfig;
