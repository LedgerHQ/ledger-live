import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Repack from "@callstack/repack";
import { ReanimatedPlugin } from "@callstack/repack-plugin-reanimated";
import { ExpoModulesPlugin } from "@callstack/repack-plugin-expo-modules";
import { createRequire } from "node:module";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { withRozenite } from "@rozenite/repack";

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRootDir = path.resolve(__dirname, "..", "..");

const tsconfig = JSON.parse(readFileSync(path.join(__dirname, "./tsconfig.json"), "utf8"));
const resolveFromPnpmSubmodule = (...subPath) => {
  const pnpmDir = path.resolve(projectRootDir, "node_modules", ".pnpm");
  for (const entry of readdirSync(pnpmDir)) {
    const candidate = path.join(pnpmDir, entry, ...subPath);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot resolve pnpm submodule path: ${path.join(...subPath)}`);
};

const removeStarPath = moduleName => moduleName.replace("/*", "");
const buildTsAlias = (paths = {}) =>
  Object.keys(paths).reduce(
    (acc, moduleName) => ({
      ...acc,
      [removeStarPath(moduleName)]: path.resolve(__dirname, removeStarPath(paths[moduleName][0])),
    }),
    {},
  );

const nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(projectRootDir, "node_modules"),
  path.resolve(projectRootDir, "node_modules", ".pnpm"),
  path.resolve(projectRootDir, "node_modules", ".pnpm", "node_modules"),
  "node_modules",
];

const hermesParserPath = require.resolve("hermes-parser");

/**
 * When RSDOCTOR env is set (and not "0"), returns the RsdoctorRspackPlugin instance.
 * In CI, uses brief mode + JSON output for web-infra-dev/rsdoctor-action.
 * reportDir is set so the action gets a known path (per rsdoctor.dev/config/options/output).
 */
function getRsdoctorPlugin() {
  if (!process.env.RSDOCTOR || process.env.RSDOCTOR === "0") return [];
  const { RsdoctorRspackPlugin } = require("@rsdoctor/rspack-plugin");
  const isCI = process.env.CI === "true" || process.env.CI === "1";
  const options = isCI
    ? {
        disableClientServer: true,
        output: {
          mode: "brief",
          options: { type: ["json"] },
          reportDir: path.join(projectRootDir, "_rsdoctor-mobile"),
        },
      }
    : undefined;
  return [new RsdoctorRspackPlugin(options)];
}

const withRozeniteUrlFix = rozeniteConfig => {
  return async env => {
    const config = await rozeniteConfig(env);
    if (!config.devServer?.setupMiddlewares) {
      return config;
    }

    const originalSetupMiddlewares = config.devServer.setupMiddlewares;

    return {
      ...config,
      devServer: {
        ...config.devServer,
        setupMiddlewares: middlewares => {
          const result = originalSetupMiddlewares(middlewares);
          result.unshift((req, res, next) => {
            if (req.url?.startsWith("/debugger-frontend/")) {
              const newUrl = req.url.replace("/debugger-frontend/", "/rozenite/");
              res.writeHead(302, { Location: newUrl });
              res.end();
              return;
            }
            next();
          });

          return result;
        },
      },
    };
  };
};

export default withRozeniteUrlFix(
  withRozenite(
    Repack.defineRspackConfig(env => {
      const { mode, platform } = env;
      const isRsdoctor = process.env.RSDOCTOR && process.env.RSDOCTOR !== "0";
      return {
        mode,
        context: __dirname,
        entry: "./index.js",
        // When running rsdoctor, emit main bundle as .js so it's counted as JavaScript (not Other)
        ...(isRsdoctor && { output: { filename: "[name].js" } }),
        optimization: {
          minimize: false,
        },
        resolve: {
          ...Repack.getResolveOptions(platform, {
            enablePackageExports: true,
            preferNativePlatform: true,
          }),
          modules: nodeModulesPaths,
          alias: {
            ...buildTsAlias(tsconfig.compilerOptions.paths),
            // Packages with malformed exports field (missing "." subpath) - resolve to browser entry
            "@aptos-labs/aptos-client": resolveFromPnpmSubmodule(
              "node_modules",
              "@aptos-labs",
              "aptos-client",
              "dist",
              "browser",
              "index.browser.mjs",
            ),
            "rpc-websockets": resolveFromPnpmSubmodule(
              "node_modules",
              "rpc-websockets",
              "dist",
              "index.browser.mjs",
            ),
          },
          fallback: {
            ...require("node-libs-react-native"),
            fs: require.resolve("react-native-level-fs"),
            net: require.resolve("react-native-tcp-socket"),
            tls: false,
            child_process: false,
            cluster: false,
            dgram: false,
            dns: false,
            readline: false,
            module: false,
            repl: false,
            vm: false,
          },
        },
        module: {
          rules: [
            {
              test: /\.[cm]?[jt]sx?$/,
              use: {
                loader: "@callstack/repack/babel-loader",
                parallel: true,
                options: {
                  hermesParserPath,
                },
              },
              resolve: {
                fullySpecified: false,
              },
              type: "javascript/auto",
            },
            ...Repack.getAssetTransformRules(),
          ],
        },
        plugins: [
          new Repack.RepackPlugin(),
          new ReanimatedPlugin({
            unstable_disableTransform: true,
          }),
          new ExpoModulesPlugin(),
          ...getRsdoctorPlugin(),
        ],
      };
    }),
    {
      enabled: process.env.WITH_ROZENITE === "true",
    },
  ),
);
