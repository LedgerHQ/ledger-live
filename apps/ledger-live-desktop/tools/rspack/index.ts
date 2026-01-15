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

export { createMainConfig } from "./rspack.main";
export { createRendererConfig } from "./rspack.renderer";
export { createPreloaderConfig } from "./rspack.preloader";
export { createWebviewPreloaderConfig } from "./rspack.webviewPreloader";
export { createWebviewDappPreloaderConfig } from "./rspack.webviewDappPreloader";
export { createWorkerConfig, getWorkerEntries } from "./rspack.worker";

export * from "./rspack.common";
export * from "./utils";
export * from "./devServer";
