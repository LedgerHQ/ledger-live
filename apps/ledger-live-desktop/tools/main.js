#!/usr/bin/env node
const Electron = require("./utils/Electron");
const WebpackWorker = require("./utils/WebpackWorker");
const WebpackBar = require("webpackbar");
const webpack = require("webpack");
const yargs = require("yargs");
const nodeExternals = require("webpack-node-externals");
const childProcess = require("child_process");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const {
  findNativeModules,
  copyNodeModule,
  dependencyTree,
  buildWebpackExternals,
} = require("native-modules-tools");
const path = require("path");

const lldRoot = path.resolve(__dirname, "..");
const pkg = require("./../package.json");

const NIGHTLY = pkg.name.includes("nightly") || pkg.version.includes("nightly");

const { SENTRY_URL } = process.env;

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
    __NIGHTLY__: NIGHTLY,
    // See: https://github.com/node-formidable/formidable/issues/337
    "global.GENTLY": false,
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
    __NIGHTLY__: NIGHTLY,
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
    devtool: mode === "development" ? "eval-source-map" : undefined,
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
    devtool: mode === "development" ? "eval-source-map" : undefined,
    // In dev mode, treat everything as an external module so we can rely on the node_modules folder.
    // In prod. mode rely on the detected native modules to exclude them from the bundle.
    externals:
      mode !== "production"
        ? [nodeExternals()]
        : mappedNativeModules
        ? buildWebpackExternals(mappedNativeModules)
        : wpConf.externals,
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
  // First, we crawl the production dependencies and find every node.js native modules.
  const nativeModulesPaths = findNativeModules(lldRoot);
  console.log("Found the following native modules:", nativeModulesPaths);

  // Then for each one of these native modules…
  const mappedNativeModules = nativeModulesPaths.reduce((acc, module) => {
    // We copy the module to a special directory that will be copied by electron-bundler in place of the node_modules.
    const copyResults = copyNodeModule(module, {
      destination: "dist",
      appendVersion: true,
    });
    const { target } = copyResults;
    // Based on the target directory (dist/node_modules/name@version) we crawl the dependencies.
    const tree = dependencyTree(module);
    // And we populate nested node_modules manually (npm-like).
    const stack = [[target, tree.dependencies]];
    let current = null;
    while ((current = stack.shift())) {
      const [path, dependencies] = current;
      Array.from(dependencies.values()).forEach(dependency => {
        const copyResult = copyNodeModule(dependency.path, {
          destination: path,
        });
        stack.push([copyResult.target, dependency.dependencies]);
      });
    }
    acc[copyResults.source] = copyResults;

    // And finally we return an object containing useful data for the module.
    // (its source/destination directories, name and version)
    // This will be used to tell webpack to treat them as externals and to require from the correct path.
    // (something like 'dist/node_modules/name@version')
    return acc;
  }, {});

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

  await Promise.all([
    mainWorker.bundle(),
    rendererWorker.bundle(),
    preloaderWorker.bundle(),
    webviewPreloaderWorker.bundle(),
  ]).catch(err => {
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
