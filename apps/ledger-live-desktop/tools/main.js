#!/usr/bin/env node

const fs = require("fs");
const yargs = require("yargs");
const Electron = require("./utils/Electron");
const processReleaseNotes = require("./utils/processReleaseNotes");
const {
  processNativeModules,
  copyFolderRecursively,
  esBuildExternalsPlugin,
} = require("@ledgerhq/native-modules-tools");
const path = require("path");
const { esbuild, NodeExternalsPlugin } = require("@ledgerhq/esbuild-utils");
const { createServer } = require("vite");

const { buildMainEnv, buildRendererEnv, buildViteConfig, lldRoot } = require("./utils");

const startDev = async argv => {
  let execa = await import("execa").then(mod => mod.execa);
  const electron = new Electron("./.webpack/main.bundle.js", execa);

  const OnRebuildPlugin = {
    name: "onRebuild",
    setup(build) {
      build.onEnd(result => {
        if (result.errors.length > 0) {
          console.log(`Build ended with ${result.errors.length} errors.`);
          console.log(result.errors.map(error => error.message).join("\n"));
        } else {
          electron.reload();
        }
      });
    },
  };

  const mainConfig = {
    ...require("./config/main.esbuild"),
    define: buildMainEnv("development", argv),
    plugins: [
      ...(require("./config/main.esbuild").plugins || []),
      NodeExternalsPlugin,
      OnRebuildPlugin,
    ],
    minify: false,
  };
  const preloaderConfig = {
    ...require("./config/preloader.esbuild"),
    define: buildMainEnv("development", argv),
    plugins: [...(require("./config/preloader.esbuild").plugins || []), OnRebuildPlugin],
    minify: false,
  };
  const webviewPreloaderConfig = {
    ...require("./config/webviewPreloader.esbuild"),
    define: buildMainEnv("development", argv),
    plugins: [...(require("./config/webviewPreloader.esbuild").plugins || []), OnRebuildPlugin],
    minify: false,
  };
  const webviewDappPreloaderConfig = {
    ...require("./config/webviewDappPreloader.esbuild"),
    define: buildMainEnv("development", argv),
    plugins: [...(require("./config/webviewDappPreloader.esbuild").plugins || []), OnRebuildPlugin],
    minify: false,
  };

  try {
    await processReleaseNotes();
  } catch (error) {
    console.log(error);
  }

  const rendererServer = await createServer(buildViteConfig(argv));

  const contexts = await Promise.all([
    esbuild.context(mainConfig),
    esbuild.context(preloaderConfig),
    esbuild.context(webviewPreloaderConfig),
    esbuild.context(webviewDappPreloaderConfig),
  ]);

  await rendererServer.listen();
  await Promise.all(contexts.map(context => context.watch()));

  rendererServer.printUrls();
  electron.start();
};

const build = async argv => {
  let mappedNativeModules;

  if (!process.env.TESTING) {
    // Find native modules and copy them to ./dist/node_modules with their dependencies.
    mappedNativeModules = await processNativeModules({ root: lldRoot, destination: "dist" });
    // Also copy to ./node_modules to be able to run the production build with playwright.
    await copyFolderRecursively(
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
  const workersPath = path.join(lldRoot, "src", "renderer", "webworkers", "workers");

  const results = await Promise.all([
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
      ...require("./config/webviewDappPreloader.esbuild"),
      define: buildMainEnv("production", argv),
    }),
    esbuild.build({
      ...require("./config/renderer.esbuild"),
      define: buildRendererEnv("production"),
    }),

    ...fs.readdirSync(workersPath).map(file =>
      esbuild.build({
        ...require("./config/renderer.esbuild"),
        entryPoints: [path.join(workersPath, file)],
        entryNames: `${
          file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file
        }.worker`,
        define: buildRendererEnv("production"),
      }),
    ),
  ]);

  if (process.env.GENERATE_METAFILES) {
    // analyze bundle sizes. use it with https://esbuild.github.io/analyze/
    fs.writeFileSync("metafile.main.json", JSON.stringify(results[0].metafile), "utf-8");
    fs.writeFileSync("metafile.preloader.json", JSON.stringify(results[1].metafile), "utf-8");
    fs.writeFileSync(
      "metafile.webviewPreloader.json",
      JSON.stringify(results[2].metafile),
      "utf-8",
    );
    fs.writeFileSync(
      "metafile.webviewDappPreloader.json",
      JSON.stringify(results[3].metafile),
      "utf-8",
    );
    fs.writeFileSync("metafile.renderer.json", JSON.stringify(results[4].metafile), "utf-8");
    fs.writeFileSync("metafile.renderer.worker.json", JSON.stringify(results[5].metafile), "utf-8");
  }
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
