import { rspack, type RspackOptions, type Watching } from "@rspack/core";
import { RspackDevServer } from "@rspack/dev-server";
import type { Configuration as DevServerConfiguration } from "@rspack/dev-server";
import { createRendererConfig } from "./rspack.renderer";
import { createMainConfig } from "./rspack.main";
import { createPreloaderConfig } from "./rspack.preloader";
import { createWebviewPreloaderConfig } from "./rspack.webviewPreloader";
import { createWebviewDappPreloaderConfig } from "./rspack.webviewDappPreloader";
import { lldRoot } from "./utils";
import path from "path";

export interface DevServerOptions {
  port: number;
  onMainRebuild?: () => void;
}

/**
 * Creates and starts the rspack dev server for the renderer process
 * with HMR support
 */
export async function createDevServer(options: DevServerOptions): Promise<RspackDevServer> {
  const { port } = options;

  // Create renderer config with dev server options
  const rendererConfig = createRendererConfig("development", { devServer: true });

  // Add dev server configuration
  const devServerConfig: DevServerConfiguration = {
    port,
    hot: true,
    liveReload: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
    static: {
      directory: path.join(lldRoot, "src", "renderer"),
      publicPath: "/",
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    historyApiFallback: true,
    devMiddleware: {
      writeToDisk: true,
    },
  };

  const compiler = rspack(rendererConfig);
  const server = new RspackDevServer(devServerConfig, compiler);

  return server;
}

/**
 * Creates watchers for main process and preloader builds
 * that restart Electron when changes are detected
 */
export function createMainWatchers(options: DevServerOptions): Promise<Watching[]> {
  const { port, onMainRebuild } = options;
  const argv = { port };

  const configs: RspackOptions[] = [
    createMainConfig("development", argv),
    createPreloaderConfig("development", argv),
    createWebviewPreloaderConfig("development", argv),
    createWebviewDappPreloaderConfig("development", argv),
  ];

  const watchers = configs.map(config => {
    const compiler = rspack(config);

    return new Promise<Watching>(resolve => {
      const watching = compiler.watch({}, (err, stats) => {
        if (err) {
          console.error(`[${config.name}] Build error:`, err);
          return;
        }

        if (stats?.hasErrors()) {
          console.error(`[${config.name}] Build failed with errors:`);
          console.error(stats.toString({ colors: true, errors: true }));
          return;
        }

        console.log(`[${config.name}] Build completed successfully`);

        // Trigger Electron reload for main process changes
        if (config.name === "main" && onMainRebuild) {
          onMainRebuild();
        }
      });

      // Resolve immediately - watching has started
      resolve(watching);
    });
  });

  return Promise.all(watchers);
}

/**
 * Starts the full development environment
 */
export async function startDev(options: DevServerOptions): Promise<{
  server: RspackDevServer;
  watchers: Watching[];
  close: () => Promise<void>;
}> {
  console.log("Starting rspack development server...");

  // Start renderer dev server
  const server = await createDevServer(options);
  await server.start();

  console.log(`Renderer dev server running at http://localhost:${options.port}`);

  // Start watchers for main process
  const watchers = await createMainWatchers(options);

  console.log("All watchers started successfully");

  return {
    server,
    watchers,
    close: async () => {
      // Close all watchers
      await Promise.all(
        watchers.map(
          watcher =>
            new Promise<void>(resolve => {
              watcher.close(() => {
                resolve();
              });
            }),
        ),
      );
      // Stop dev server
      await server.stop();
    },
  };
}
