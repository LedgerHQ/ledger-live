import type { AndroidEntry, IosEntry } from 'logkitten';
import type { VideokittenOptionsIOS, VideokittenOptionsAndroid } from 'videokitten';

export type OnErrorHandlerFn = (error: Error) => void;
export type OnErrorHandler = OnErrorHandlerFn | 'throw' | 'ignore' | 'warn';

export type DetoxAllure2AdapterOptions = {
  /**
   * Device logs configuration for per-step logging
   */
  deviceLogs?: boolean | DetoxAllure2AdapterDeviceLogsOptions;
  /**
   * Device screenshots configuration for per-step logging
   */
  deviceScreenshots?: boolean | DetoxAllure2AdapterDeviceScreenshotOptions;
  /**
   * Device video recording for failed tests
   */
  deviceVideos?: boolean | DetoxAllure2AdapterDeviceVideoOptions;
  /**
   * View hierarchy XML visualization for test failures
   */
  deviceViewHierarchy?: boolean | DetoxAllure2AdapterDeviceViewHierarchyOptions;
  /**
   * Callback to handle errors
   */
  onError?: OnErrorHandler;
  /**
   * How to handle user artifacts (device.takeScreenshot(), etc)
   * - `move`: Copy user artifacts to the allure attachments directory and delete the temporary file after the test suite completes
   * - `copy`: Copy user artifacts to the allure attachments directory and keep the file intact
   * - `ignore`: Ignore user artifacts
   * @default 'move'
   */
  userArtifacts?: 'ignore' | 'copy' | 'move';
};

export interface DetoxAllure2AdapterDeviceLogsOptions {
  ios?: (entry: IosEntry) => boolean;
  android?: (entry: AndroidEntry) => boolean;
  override?: boolean;
  saveAll?: boolean;
  /**
   * Synchronization delay (ms) for log collection. 0 disables, number for both, or { ios, android } for per-platform.
   * @default 500
   */
  syncDelay?: number | { ios?: number; android?: number };
}

export interface DetoxAllure2AdapterDeviceScreenshotOptions {
  /**
   * Whether to save all screenshots
   * @default false
   */
  saveAll?: boolean;
}

export interface DetoxAllure2AdapterDeviceVideoOptions {
  /**
   * Whether to save all videos
   * @default false
   */
  saveAll?: boolean;
  /**
   * Controls when video recording starts.
   * - If `true` (default), recording begins lazily on the first device interaction (step).
   * - If `false`, recording starts immediately at the beginning of each test.
   * @default true
   */
  lazyStart?: boolean;
  ios?: Partial<VideokittenOptionsIOS>;
  android?: Partial<VideokittenOptionsAndroid>;
}

export interface DetoxAllure2AdapterDeviceViewHierarchyOptions {
  /**
   * Path or content for a custom XSL stylesheet to control view hierarchy visualization.
   *
   * - If a URL is provided, it is used as an external stylesheet.
   * - If the string starts with {@code <?xml}, it is embedded as a data URI.
   * - If `false`, `null`, or empty string, no stylesheet is applied (raw XML output).
   * - If `undefined`, the default stylesheet is used.
   * - For best browser compatibility, host your stylesheet on the same domain as your Allure reports.
   *
   * @see https://unpkg.com/detox-allure2-adapter@alpha/view-hierarchy.xsl
   * @see node_modules/detox-allure2-adapter/view-hierarchy.xsl
   *
   * @example
   * // Use an external stylesheet URL
   * 'https://my-allure-reports-domain.com/path/to/view-hierarchy.xsl'
   *
   * @example
   * // Use an inline stylesheet (data URI)
   * '<?xml version="1.0" encoding="utf-8"?><xsl:stylesheet...'
   *
   * @example
   * // Disable stylesheet (raw XML output)
   * false
   * null
   * ''
   */
  stylesheet?: string | null | false;
}
