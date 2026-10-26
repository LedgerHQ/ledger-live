/**
 * Rspack configuration exports for ledger-live-desktop
 *
 * This module provides configuration factories for all build targets:
 * - Main process (Electron main)
 * - Renderer process (Electron renderer / browser)
 * - Preloader (Electron preload script)
 * - WebView preloader (for webview contexts)
 * - WebView DApp preloader (for DApp webviews)
 * - Workers (Web workers)
 */

export { createMainConfig } from "./rspack.main.ts";
export { createRendererConfig } from "./rspack.renderer.ts";
export { createPreloaderConfig } from "./rspack.preloader.ts";
export { createWebviewPreloaderConfig } from "./rspack.webviewPreloader.ts";
export { createWebviewDappPreloaderConfig } from "./rspack.webviewDappPreloader.ts";
export { createWorkerConfig, getWorkerEntries } from "./rspack.worker.ts";
export { createZcashUtilityConfig } from "./rspack.zcashUtility.ts";

export * from "./rspack.common.ts";
export * from "./utils.ts";
export * from "./devServer.ts";
