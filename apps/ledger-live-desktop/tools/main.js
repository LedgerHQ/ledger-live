#!/usr/bin/env node
const Electron = require("./utils/Electron");
const WebpackWorker = require("./utils/WebpackWorker");
const processReleaseNotes = require("./utils/processReleaseNotes");
const WebpackBar = require("webpackbar");
const webpack = require("webpack");
const yargs = require("yargs");
const nodeExternals = require("webpack-node-externals");
const childProcess = require("child_process");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const {
  processNativeModules,
  copyFolderRecursivelySync,
  buildWebpackExternals,
} = require("native-modules-tools");
const path = require("path");
const { prerelease } = require("semver");

const lldRoot = path.resolve(__dirname, "..");
const pkg = require("./../package.json");

const parsed = prerelease(pkg.version);
let PRERELEASE = false;
let CHANNEL;
if (parsed) {
  PRERELEASE = !!(parsed && parsed.length);
  CHANNEL = parsed[0];
}

const SENTRY_URL = process.env?.SENTRY_URL;

const GIT_REVISION = childProcess
  .execSync("git rev-parse --short HEAD")
  .toString("utf8")
  .trim();

// TODO: ADD BUNDLE ANALYZER

const bundles = {
  renderer: {
    name: "renderer",
    wpConf: require("../renderer.webpack.config"),
    color: "teal",
  },
  main: {
    name: "main",
    wpConf: require("../main.webpack.config"),
    color: "orange",
  },
  preloader: {
    name: "preloader",
    wpConf: require("../preloader.webpack.config"),
    color: "purple",
  },
  webviewPreloader: {
    name: "webviewPreloader",
    wpConf: require("../webviewPreloader.webpack.config"),
    color: "yellow",
  },
};

const buildMainEnv = (mode, config, argv) => {
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

const buildRendererEnv = (mode, config) => {
  const env = {
    __DEV__: JSON.stringify(mode === "development"),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_REVISION__: JSON.stringify(GIT_REVISION),
    __SENTRY_URL__: JSON.stringify(SENTRY_URL || null),
    __PRERELEASE__: JSON.stringify(PRERELEASE),
    __CHANNEL__: JSON.stringify(CHANNEL),
  };

  return env;
};

const buildRendererConfig = (mode, config, argv) => {
  const { wpConf, color, name } = config;

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

  const module = {
    ...wpConf.module,
    rules:
      mode === "development" || process.env.INSTRUMENT_BUILD
        ? [
            ...wpConf.module.rules,
            {
              test: /\.js$/,
              use: {
                loader: "istanbul-instrumenter-loader",
                options: { esModules: true },
              },
              enforce: "post",
              exclude: /node_modules|tests/,
            },
          ]
        : wpConf.module.rules,
  };

  return {
    ...wpConf,
    mode: mode === "production" ? "production" : "development",
    devtool: mode === "development" ? "eval-source-map" : "source-map",
    entry,
    plugins: [
      ...plugins,
      new WebpackBar({ name, color }),
      new webpack.DefinePlugin(buildRendererEnv(mode, wpConf, argv)),
    ],
    node: {
      __dirname: false,
      __filename: false,
    },
    output: {
      ...wpConf.output,
      publicPath: mode === "production" ? "./" : "/webpack",
    },
    module,
  };
};

const buildMainConfig = (mode, config, argv, mappedNativeModules) => {
  const { wpConf, color, name } = config;
  return {
    ...wpConf,
    mode: mode === "production" ? "production" : "development",
    devtool: mode === "development" ? "eval-source-map" : "source-map",
    // In 'dev' mode, treat everything as an external module so we can rely on the node_modules folder.
    // In 'production' mode we exclude the native modules from the bundle.
    externals:
      mode !== "production" || !mappedNativeModules
        ? [nodeExternals()]
        : buildWebpackExternals(mappedNativeModules),
    node: {
      __dirname: false,
      __filename: false,
    },
    plugins: [
      ...wpConf.plugins,
      new WebpackBar({ name, color }),
      new webpack.DefinePlugin(buildMainEnv(mode, wpConf, argv)),
    ],
  };
};

const startDev = async argv => {
  const mainWorker = new WebpackWorker("main", buildMainConfig("development", bundles.main, argv));
  const preloaderWorker = new WebpackWorker(
    "preloader",
    buildMainConfig("development", bundles.preloader, argv),
  );
  const webviewPreloaderWorker = new WebpackWorker(
    "webviewPreloader",
    buildMainConfig("development", bundles.webviewPreloader, argv),
  );
  const rendererWorker = new WebpackWorker(
    "renderer",
    buildRendererConfig("development", bundles.renderer),
  );
  const electron = new Electron("./.webpack/main.bundle.js");

  try {
    await processReleaseNotes();
  } catch (error) {
    console.log(error);
  }

  await Promise.all([
    mainWorker.watch(() => {
      electron.reload();
    }),
    preloaderWorker.watch(() => {
      electron.reload();
    }),
    webviewPreloaderWorker.watch(() => {
      electron.reload();
    }),
    rendererWorker.serve(argv.port),
  ]);
  electron.start();
};

const build = async argv => {
  let mappedNativeModules;

  if (!process.env.TESTING) {
    // Find native modules and copy them to ./dist/node_modules with their dependencies.
    mappedNativeModules = processNativeModules({ root: lldRoot, destination: "dist" });
    // Also copy to ./node_modules to be able to run the production build with playwright.
    copyFolderRecursivelySync(
      path.join(lldRoot, "dist", "node_modules"),
      path.join(lldRoot, "node_modules"),
    );
  }
  const mainConfig = buildMainConfig("production", bundles.main, argv, mappedNativeModules);
  const preloaderConfig = buildMainConfig(
    "production",
    bundles.preloader,
    argv,
    mappedNativeModules,
  );
  const webviewPreloaderConfig = buildMainConfig(
    "production",
    bundles.webviewPreloader,
    argv,
    mappedNativeModules,
  );
  const rendererConfig = buildRendererConfig("production", bundles.renderer, argv);

  const mainWorker = new WebpackWorker("main", mainConfig);
  const rendererWorker = new WebpackWorker("renderer", rendererConfig);
  const preloaderWorker = new WebpackWorker("preloader", preloaderConfig);
  const webviewPreloaderWorker = new WebpackWorker("preloader", webviewPreloaderConfig);

  try {
    await processReleaseNotes();
  } catch (error) {
    console.log(error);
  }

  await Promise.all([
    mainWorker.bundle(),
    preloaderWorker.bundle(),
    webviewPreloaderWorker.bundle(),
  ])
    .then(() => rendererWorker.bundle())
    .catch(err => {
      if (err instanceof Error) {
        throw err;
      }
      console.error(err.compilation.errors);
      throw new Error("Build failed.");
    });
};

yargs
  .usage("Usage: $0 <command> [options]")
  .command({
    command: ["dev", "$0"],
    desc: "start the development workflow",
    builder: yargs =>
      yargs.option("port", {
        alias: "p",
        type: "number",
        default: 8080,
      }),
    handler: startDev,
  })
  .command({
    command: "build",
    desc: "build the app for production",
    handler: build,
  })
  .help("h")
  .alias("h", "help")
  .parse();
