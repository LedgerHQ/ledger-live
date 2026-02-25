import path from "path";
import { rspack, type RspackOptions } from "@rspack/core";
import ReactRefreshPlugin from "@rspack/plugin-react-refresh";
import { commonConfig, rootFolder } from "./rspack.common";
import { buildRendererEnv, buildDotEnvDefine, DOTENV_FILE, lldRoot } from "./utils";

/**
 * Creates the rspack configuration for the Electron renderer process
 */
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
    // Use electron-renderer target - ElectronTargetPlugin handles node builtins
    target: "electron-renderer",
    entry: {
      renderer: path.resolve(rootFolder, "src", "renderer", "index.ts"),
    },
    output: {
      ...commonConfig.output,
      filename: "renderer.bundle.js",
      publicPath: isDev ? "/" : "./",
      assetModuleFilename: "assets/[name]-[hash][ext]",
    },
    devtool: isDev ? "eval-source-map" : "source-map",
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
        // Fix tests/time.js import for TIMEMACHINE feature
        "../../tests/time.js": path.resolve(rootFolder, "tests", "time.ts"),
        "../tests/time": path.resolve(rootFolder, "tests", "time.ts"),
        // Force rspack to use node/esm builds for these packages to reduce bundle size
        // These packages have browser field pointing to larger UMD/web bundles
        "icon-sdk-js": path.resolve(
          rootFolder,
          "..",
          "..",
          "node_modules",
          ".pnpm",
          "icon-sdk-js@1.5.2",
          "node_modules",
          "icon-sdk-js",
          "build",
          "icon-sdk-js.node.min.js",
        ),
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
        // JSON files in src/ - emit as assets and load via require() at runtime (prod only)
        // In dev mode, rspack's default JSON handler inlines them for HMR compatibility
        // In prod mode, this replicates esbuild's JsonPlugin behavior for reduced bundle size
        ...(isDev
          ? []
          : [
              {
                test: /\.json$/,
                include: path.resolve(rootFolder, "src"),
                type: "javascript/auto" as const,
                use: [path.resolve(__dirname, "animationJsonLoader.cjs")],
              },
            ]),
      ],
    },
    plugins: [
      // ElectronTargetPlugin for proper node/electron module handling
      new rspack.electron.ElectronTargetPlugin("renderer"),
      new rspack.DefinePlugin({
        ...buildRendererEnv(mode),
        ...buildDotEnvDefine(DOTENV_FILE),
      }),
      new rspack.HtmlRspackPlugin({
        template: path.resolve(rootFolder, "src", "renderer", "index.html"),
        filename: "index.html",
        title: "Ledger Wallet",
        inject: "body",
        scriptLoading: "defer",
      }),
      // React Fast Refresh for development
      ...(useDevServer ? [new ReactRefreshPlugin()] : []),
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
