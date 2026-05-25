const fs = require("fs");
const path = require("path");
const Repack = require("@callstack/repack");

// Re.Pack's dev server only serves files registered in `compilation.assets`.
// @module-federation/dts-plugin writes `@mf-types.zip` straight to disk in dev
// mode (it only emits as a compilation asset in prod), so Re.Pack returns 404.
// This middleware bridges the gap by serving the zip from the build output dir.
const MF_TYPES_URL_RE = /^\/(ios|android)\/@mf-types(\.zip|\.d\.ts)$/;
function serveMfTypes(req, res, next) {
  const match = req.url && req.url.match(MF_TYPES_URL_RE);
  if (!match) return next();
  const [, platform, ext] = match;
  const file = path.join(__dirname, "build", "swap", platform, `@mf-types${ext}`);
  if (!fs.existsSync(file)) return next();
  res.setHeader("Content-Type", ext === ".zip" ? "application/zip" : "text/plain");
  fs.createReadStream(file).pipe(res);
}

/**
 * Rspack configuration for RemoteApp federated module
 * @type {import('@callstack/repack').RepackRspackConfigFn}
 */
module.exports = env => {
  const {
    mode = "development",
    context = __dirname,
    platform = process.env.PLATFORM || "ios",
    minimize = mode === "production",
    devServer = undefined,
  } = env;

  if (!platform) {
    throw new Error("Missing platform");
  }

  return {
    mode,
    context,
    entry: "./index.js",
    resolve: {
      ...Repack.getResolveOptions(platform, { enablePackageExports: true }),
    },
    output: {
      path: "[context]/build/swap/[platform]",
      uniqueName: "swap",
    },
    optimization: {
      minimize,
      chunkIds: "named",
    },
    module: {
      rules: [
        // RN 0.81 ships Flow Component Syntax (`component View(...)`) and Flow
        // enums in react-native sources. Re.Pack's flow-loader (flow-remove-types)
        // can only strip type annotations, not these constructs, so SWC fails to
        // parse them. Run @react-native/babel-preset via Re.Pack's babel-loader
        // (which uses hermes-parser) on RN packages first so SWC sees plain JS.
        {
          test: /\.jsx?$/,
          include: Repack.getModulePaths(["react-native", "@react-native"]),
          enforce: "pre",
          use: {
            loader: "@callstack/repack/babel-loader",
            options: {
              presets: [require.resolve("@react-native/babel-preset")],
            },
          },
        },
        ...Repack.getJsTransformRules({
          swc: {
            externalHelpers: false,
            jsxRuntime: "automatic",
          },
          flow: {
            enabled: false,
          },
          codegen: {
            enabled: true,
          },
        }),
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin({
        context,
        mode,
        platform,
        devServer,
        extraChunks: [
          {
            include: /.*/,
            type: "remote",
            outputPath: `build/swap/${platform}/output-remote`,
          },
        ],
      }),
      new Repack.plugins.ModuleFederationPluginV2({
        name: "swap",
        filename: "swap.container.js.bundle",
        exposes: {
          "./HelloWorld": "./src/HelloWorld",
        },
        dts: {
          generateTypes: {
            tsConfigPath: "./tsconfig.json",
            compileInChildProcess: true,
            generateAPITypes: true,
          },
          consumeTypes: false,
        },
        // The dynamic-remote-type-hints runtime plugin opens a WebSocket via
        // `isomorphic-ws`, which crashes under Hermes/RN. `dev` is a top-level
        // MF option, sibling of `dts`.
        dev: {
          disableDynamicRemoteTypeHints: true,
          disableHotTypesReload: true,
          disableLiveReload: true,
        },
        shared: {
          react: { singleton: true, eager: true, requiredVersion: "^19.0.0" },
          "react-native": { singleton: true, eager: true, requiredVersion: "*" },
          "react-redux": { singleton: true, requiredVersion: "^9.0.0" },
          "@reduxjs/toolkit": { singleton: true, requiredVersion: "^2.0.0" },
          "@shared/mobile-host-runtime": { singleton: true, requiredVersion: "*" },
        },
      }),
    ],
    devServer: {
      port: 9000,
      setupMiddlewares: middlewares => {
        middlewares.unshift(serveMfTypes);
        return middlewares;
      },
    },
  };
};
