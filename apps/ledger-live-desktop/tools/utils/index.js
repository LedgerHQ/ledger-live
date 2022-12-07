const childProcess = require("child_process");
const { prerelease } = require("semver");
const path = require("path");
const { StripFlowPlugin, DotEnvPlugin, nodeExternals } = require("esbuild-utils");
const { flowPlugin } = require("@bunchtogether/vite-plugin-flow");
const electronPlugin = require("vite-plugin-electron/renderer");
const reactPlugin = require("@vitejs/plugin-react");
const { defineConfig } = require("vite");

const SENTRY_URL = process.env?.SENTRY_URL;
const pkg = require("../../package.json");
const lldRoot = path.resolve(__dirname, "..", "..");

const GIT_REVISION = childProcess
  .execSync("git rev-parse --short HEAD")
  .toString("utf8")
  .trim();

const parsed = prerelease(pkg.version);
let PRERELEASE = false;
let CHANNEL;
if (parsed) {
  PRERELEASE = !!(parsed && parsed.length);
  CHANNEL = parsed[0];
}

const DOTENV_FILE = process.env.TESTING
  ? ".env.testing"
  : process.env.STAGING
  ? ".env.staging"
  : process.env.NODE_ENV === "production"
  ? ".env.production"
  : ".env";

// TODO: ADD BUNDLE ANALYZER

const buildMainEnv = (mode, argv) => {
  const env = {
    __DEV__: JSON.stringify(mode === "development"),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_REVISION__: JSON.stringify(GIT_REVISION),
    __SENTRY_URL__: JSON.stringify(SENTRY_URL || null),
    // See: https://github.com/node-formidable/formidable/issues/337
    "global.GENTLY": false,
    __PRERELEASE__: JSON.stringify(PRERELEASE),
    __CHANNEL__: JSON.stringify(CHANNEL),
  };

  if (mode === "development") {
    env.INDEX_URL = JSON.stringify(`http://localhost:${argv.port}/index.html`);
  }

  return env;
};

const buildRendererEnv = mode => {
  const env = {
    __DEV__: JSON.stringify(mode === "development"),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_REVISION__: JSON.stringify(GIT_REVISION),
    __SENTRY_URL__: JSON.stringify(SENTRY_URL || null),
    __PRERELEASE__: JSON.stringify(PRERELEASE),
    __CHANNEL__: JSON.stringify(CHANNEL),
    "process.env.NODE_ENV": JSON.stringify(mode),
  };

  return env;
};

const buildViteConfig = argv =>
  defineConfig({
    configFile: false,
    root: path.resolve(lldRoot, "src", "renderer"),
    server: {
      port: argv.port,
      // force: true,
    },
    define: {
      ...buildRendererEnv("development"),
      ...DotEnvPlugin.buildDefine(DOTENV_FILE),
    },
    resolve: {
      conditions: ["node", "import", "module", "browser", "default"],
      alias: {
        "~": path.resolve(lldRoot, "src"),
        qrloop: require.resolve("qrloop"),
        "@ledgerhq/react-ui": path.join(
          path.dirname(require.resolve("@ledgerhq/react-ui/package.json")),
          "lib",
        ),
        electron: path.join(__dirname, "electronRendererStubs.js"),
      },
    },
    optimizeDeps: {
      // The common.js dependencies and files need to be force-added below:
      include: ["@ledgerhq/hw-app-eth/erc20"],
      esbuildOptions: {
        target: ["es2020"],
        plugins: [
          StripFlowPlugin(/.jsx?$/),
          {
            name: "Externalize Nodejs Standard Library",
            setup(build) {
              nodeExternals.forEach(external => {
                build.onResolve({ filter: new RegExp(`^${external}$`) }, args => ({
                  path: external,
                  external: true,
                }));
              });
            },
          },
          {
            name: "fix require('buffer/') calls",
            setup(build) {
              build.onResolve({ filter: /^buffer\/$/ }, args => {
                if (!args.importer) return;

                const result = require.resolve(args.path, {
                  paths: [args.resolveDir],
                });

                return {
                  path: result,
                };
              });
            },
          },
        ],
      },
    },
    plugins: [
      flowPlugin(),
      reactPlugin(),
      electronPlugin(),
      // {
      //   name: "override:electron:config-serve",
      //   apply: "serve",
      //   config(config) {
      //     // Override stubs to add missing remote and WebviewTag exports
      //     config.resolve.alias.electron = path.join(__dirname, "electronRendererStubs.js");
      //   },
      // },
    ],
  });

module.exports = {
  buildMainEnv,
  buildRendererEnv,
  buildViteConfig,
  lldRoot,
  DOTENV_FILE,
};
