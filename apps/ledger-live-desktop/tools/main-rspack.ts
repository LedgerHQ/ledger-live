#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { rspack } from "@rspack/core";

import {
  createMainConfig,
  createRendererConfig,
  createPreloaderConfig,
  createWebviewPreloaderConfig,
  createWebviewDappPreloaderConfig,
  createWorkerConfig,
  startDev,
} from "./rspack";

const yargs = require("yargs");
const processReleaseNotes = require("./utils/processReleaseNotes");

// Electron process manager
class Electron {
  private instance: any = null;
  private bundlePath: string;
  private electronPath: string;
  private execa: any;

  constructor(
    bundlePath: string,
    execa: any,
    electronPath: string = "./node_modules/.bin/electron",
  ) {
    this.bundlePath = bundlePath;
    this.electronPath = electronPath;
    this.execa = execa;
  }

  start() {
    if (!this.instance) {
      const args = (process.env.ELECTRON_ARGS || "").split(/[ ]+/).filter(Boolean);
      if (args.length) console.log("Electron starts with", args);
      // reject: false prevents throwing when process is killed during reload
      this.instance = this.execa(this.electronPath, [this.bundlePath, ...args], { reject: false });
      this.instance.stdout?.pipe(process.stdout);
      this.instance.stderr?.pipe(process.stderr);
    }
  }

  stop() {
    if (this.instance) {
      this.instance.kill();
      this.instance = null;
    }
  }

  reload() {
    if (this.instance) {
      this.stop();
      this.start();
    }
  }
}

/**
 * Start development mode with HMR
 */
const startDevMode = async (argv: { port: number }) => {
  const execa = await import("execa").then(mod => mod.execa);
  const electron = new Electron("./.webpack/main.bundle.js", execa);

  try {
    await processReleaseNotes();
  } catch (error) {
    console.log("Warning: Could not process release notes:", error);
  }

  console.log("🚀 Starting rspack development environment...\n");

  // Start the development server and watchers
  const { close } = await startDev({
    port: argv.port,
    onMainRebuild: () => {
      console.log("♻️  Reloading Electron...");
      electron.reload();
    },
  });

  // Start Electron after initial builds complete
  // Wait a bit for the initial build to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  electron.start();

  console.log("\n✅ Development environment ready!");
  console.log(`   Renderer: http://localhost:${argv.port}`);
  console.log("   Press Ctrl+C to stop\n");

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Shutting down...");
    electron.stop();
    await close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

/**
 * Build for production
 */
const build = async (argv: { port?: number }) => {
  try {
    await processReleaseNotes();
  } catch (error) {
    console.log("Warning: Could not process release notes:", error);
  }

  console.log("🔨 Building for production with rspack...\n");

  const configs = [
    { name: "main", config: createMainConfig("production", argv) },
    { name: "renderer", config: createRendererConfig("production", { devServer: false }) },
    { name: "preloader", config: createPreloaderConfig("production", argv) },
    { name: "webviewPreloader", config: createWebviewPreloaderConfig("production", argv) },
    { name: "webviewDappPreloader", config: createWebviewDappPreloaderConfig("production", argv) },
    { name: "workers", config: createWorkerConfig("production") },
  ];

  await Promise.all(
    configs.map(async ({ name, config }) => {
      return new Promise<{ name: string; stats: any }>((resolve, reject) => {
        rspack(config, (err, stats) => {
          if (err) {
            console.error(`❌ ${name} build failed:`, err);
            reject(err);
            return;
          }

          if (stats?.hasErrors()) {
            // Log to stdout first so CI always shows a readable summary (stderr may be dropped or truncated)
            const json = stats?.toJson({ all: false, errors: true });
            const errors = json?.errors || [];
            console.log(`\n❌ ${name} build failed with ${errors.length} error(s):`);
            errors.forEach((e: { message?: string; moduleName?: string }, i: number) => {
              const msg = typeof e.message === "string" ? e.message : String(e.message ?? e);
              const truncated = msg.length > 500 ? msg.slice(0, 500) + "\n... [truncated]" : msg;
              console.log(`  ${i + 1}. ${e.moduleName || "?"}: ${truncated.split("\n").join(" ")}`);
            });
            console.error(`❌ ${name} build failed with errors:`);
            console.error(stats.toString({ colors: true, errors: true }));
            reject(new Error(`${name} build failed`));
            return;
          }

          const assets = stats?.toJson({ assets: true })?.assets || [];
          const mainAsset = assets.find((a: { name: string }) => a.name.endsWith(".bundle.js"));
          if (mainAsset) {
            const sizeMB = (mainAsset.size / 1024 / 1024).toFixed(2);
            console.log(`✅ ${mainAsset.name}: ${sizeMB} MB`);
          } else {
            console.log(`✅ ${name} built successfully`);
          }
          resolve({ name, stats });
        });
      });
    }),
  );

  console.log("\n🎉 Production build complete!");
};

// CLI setup
yargs
  .usage("Usage: $0 <command> [options]")
  .command({
    command: ["dev", "$0"],
    desc: "Start the development workflow with HMR",
    builder: (y: any) =>
      y.option("port", {
        alias: "p",
        type: "number",
        default: 8080,
        description: "Development server port",
      }),
    handler: startDevMode,
  })
  .command({
    command: "build",
    desc: "Build the app for production",
    handler: build,
  })
  .help("h")
  .alias("h", "help")
  .parse();
