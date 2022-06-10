const childProcess = require("child_process");
const webpack = require("webpack");
const WebpackBar = require("webpackbar");
const { prerelease } = require("semver");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const pkg = require("../../package.json");

const SENTRY_URL = process.env?.SENTRY_URL;

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
    env.INDEX_URL = JSON.stringify(`http://localhost:${argv.port}/webpack/index.html`);
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

const buildRendererConfig = (mode, wpConf) => {
  const entry =
    mode === "development"
      ? Array.isArray(wpConf.entry)
        ? ["webpack-hot-middleware/client", ...wpConf.entry]
        : ["webpack-hot-middleware/client", wpConf.entry]
      : wpConf.entry;

  const plugins =
    mode === "development"
      ? [
          ...wpConf.plugins,
          new ReactRefreshWebpackPlugin(),
          new webpack.HotModuleReplacementPlugin(),
        ]
      : wpConf.plugins;

  return {
    ...wpConf,
    mode: mode === "production" ? "production" : "development",
    devtool: mode === "development" ? "eval-source-map" : undefined,
    entry,
    plugins: [
      ...plugins,
      new WebpackBar({ name: "renderer" }),
      new webpack.DefinePlugin(buildRendererEnv(mode)),
    ],
    node: {
      __dirname: false,
      __filename: false,
    },
    output: {
      ...wpConf.output,
      publicPath: mode === "production" ? "./" : "/webpack",
    },
    watchOptions:
      mode === "development"
        ? {
            aggregateTimeout: 150,
          }
        : undefined,
  };
};

module.exports = {
  buildMainEnv,
  buildRendererEnv,
  buildRendererConfig,
};
