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

const nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(projectRootDir, "node_modules"),
  path.resolve(projectRootDir, "node_modules", ".pnpm"),
  path.resolve(projectRootDir, "node_modules", ".pnpm", "node_modules"),
  "node_modules",
];

const packageRootCache = new Map();
const pnpmDir = path.resolve(projectRootDir, "node_modules", ".pnpm");

/**
 * Resolves a file inside a package. Tries require.resolve(package.json) first;
 * if that fails (e.g. pnpm exports), falls back to one-time .pnpm scan per package.
 * Results are cached per package.
 */
function resolvePackageFile(packageName, ...relativePathSegments) {
  let packageRoot = packageRootCache.get(packageName);
  if (packageRoot === undefined) {
    try {
      const pkgJsonPath = require.resolve(`${packageName}/package.json`, {
        paths: nodeModulesPaths,
      });
      packageRoot = path.dirname(pkgJsonPath);
    } catch {
      const subPath = ["node_modules", ...packageName.split("/"), ...relativePathSegments];
      const entries = readdirSync(pnpmDir);
      for (const entry of entries) {
        const candidate = path.join(pnpmDir, entry, ...subPath);
        if (existsSync(candidate)) {
          packageRoot = path.join(pnpmDir, entry, "node_modules", ...packageName.split("/"));
          break;
        }
      }
      if (packageRoot === undefined) {
        throw new Error(
          `Cannot resolve package ${packageName} (tried require.resolve and .pnpm scan in ${pnpmDir})`,
        );
      }
    }
    packageRootCache.set(packageName, packageRoot);
  }
  const resolved = path.join(packageRoot, ...relativePathSegments);
  if (!existsSync(resolved)) {
    throw new Error(
      `Cannot resolve ${path.join(...relativePathSegments)} in package ${packageName} (root: ${packageRoot})`,
    );
  }
  return resolved;
}

const removeStarPath = moduleName => moduleName.replace("/*", "");
const buildTsAlias = (paths = {}) =>
  Object.keys(paths).reduce(
    (acc, moduleName) => ({
      ...acc,
      [removeStarPath(moduleName)]: path.resolve(__dirname, removeStarPath(paths[moduleName][0])),
    }),
    {},
  );

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
        setupMiddlewares: (...args) => {
          const [middlewares] = args;
          const result = originalSetupMiddlewares(...args) ?? middlewares;
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
      return {
        mode,
        context: __dirname,
        entry: "./index.js",
        resolve: {
          ...Repack.getResolveOptions(platform, {
            enablePackageExports: true,
            preferNativePlatform: true,
          }),
          modules: nodeModulesPaths,
          alias: {
            ...buildTsAlias(tsconfig.compilerOptions.paths),
            // Packages with malformed exports field (missing "." subpath) - resolve to browser entry
            "@aptos-labs/aptos-client": resolvePackageFile(
              "@aptos-labs/aptos-client",
              "dist",
              "browser",
              "index.browser.mjs",
            ),
            "rpc-websockets": resolvePackageFile("rpc-websockets", "dist", "index.browser.mjs"),
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
              type: "javascript/auto",
              use: {
                loader: "@callstack/repack/babel-swc-loader",
                parallel: true,
                options: {},
              },
              resolve: { fullySpecified: false },
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
        ],
      };
    }),
    {
      enabled: process.env.WITH_ROZENITE === "true",
    },
  ),
);
