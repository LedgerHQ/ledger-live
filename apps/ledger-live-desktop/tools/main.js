#!/usr/bin/env node

const yargs = require("yargs");
const { esbuild, NodeExternalsPlugin } = require("esbuild-utils");
const Electron = require("./utils/Electron");
const WebpackWorker = require("./utils/WebpackWorker");
const processReleaseNotes = require("./utils/processReleaseNotes");
const {
  processNativeModules,
  copyFolderRecursivelySync,
  esBuildExternalsPlugin,
} = require("native-modules-tools");
const path = require("path");

const { buildMainEnv, buildRendererEnv, buildRendererConfig } = require("./utils");

const lldRoot = path.resolve(__dirname, "..");

const startDev = async argv => {
  const electron = new Electron("./.webpack/main.bundle.js");

  const devConfig = {
    minify: false,
    incremental: true,
    watch: {
      onRebuild(error, result) {
        if (error) {
          console.error("Watch build failed:", error);
        } else {
          electron.reload();
        }
      },
    },
  };

  const mainConfig = {
    ...require("./config/main.esbuild"),
    define: buildMainEnv("development", argv),
    plugins: [...(require("./config/main.esbuild").plugins || []), NodeExternalsPlugin],
    ...devConfig,
  };
  const preloaderConfig = {
    ...require("./config/preloader.esbuild"),
    define: buildMainEnv("development", argv),
    ...devConfig,
  };
  const webviewPreloaderConfig = {
    ...require("./config/webviewPreloader.esbuild"),
    define: buildMainEnv("development", argv),
    ...devConfig,
  };
  const rendererConfig = buildRendererConfig(
    "development",
    require("./config/renderer.webpack.config"),
  );

  try {
    await processReleaseNotes();
  } catch (error) {
    console.log(error);
  }

  await Promise.all([
    esbuild.build(mainConfig),
    esbuild.build(preloaderConfig),
    esbuild.build(webviewPreloaderConfig),
    new WebpackWorker("renderer", rendererConfig).serve(argv.port),
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

  try {
    await processReleaseNotes();
  } catch (error) {
    console.log(error);
  }

  const mainConfig = require("./config/main.esbuild");

  await Promise.all([
    esbuild.build({
      ...mainConfig,
      define: buildMainEnv("production", argv),
      plugins: [
        ...(mainConfig.plugins || []),
        ...(!mappedNativeModules
          ? [NodeExternalsPlugin]
          : [esBuildExternalsPlugin(mappedNativeModules)]),
      ],
    }),
    esbuild.build({
      ...require("./config/preloader.esbuild"),
      define: buildMainEnv("production", argv),
    }),
    esbuild.build({
      ...require("./config/webviewPreloader.esbuild"),
      define: buildMainEnv("production", argv),
    }),
    esbuild.build({
      ...require("./config/renderer.esbuild"),
      define: buildRendererEnv("production"),
    }),
  ]);
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
