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

export { createMainConfig } from "./rspack.main.mts";
export { createRendererConfig } from "./rspack.renderer.mts";
export { createPreloaderConfig } from "./rspack.preloader.mts";
export { createWebviewPreloaderConfig } from "./rspack.webviewPreloader.mts";
export { createWebviewDappPreloaderConfig } from "./rspack.webviewDappPreloader.mts";
export { createWorkerConfig, getWorkerEntries } from "./rspack.worker.mts";
export { createZcashUtilityConfig } from "./rspack.zcashUtility.mts";

export * from "./rspack.common.mts";
export * from "./utils.mts";
export * from "./devServer.mts";
