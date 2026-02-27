import { getMainWindow } from "~/main/window-lifecycle";
import { getDatadogBuildConfig, MAIN_ERROR_IPC_CHANNEL } from "./config";
import { shouldIgnoreErrorMessage } from "./ignoreErrors";
import { getOperatingSystemSupportStatus } from "~/support/os";

let shouldSendCallback: () => boolean = () => false;
let mainInitialized = false;

let uncaughtExceptionListener: ((error: Error) => void) | null = null;
let unhandledRejectionListener: ((reason: unknown) => void) | null = null;

/** Reset module state for tests so suites are order-independent. Do not use in production. */
export function __resetDatadogMainForTesting(): void {
  if (uncaughtExceptionListener) {
    process.off("uncaughtException", uncaughtExceptionListener);
    uncaughtExceptionListener = null;
  }
  if (unhandledRejectionListener) {
    process.off("unhandledRejection", unhandledRejectionListener);
    unhandledRejectionListener = null;
  }
  shouldSendCallback = () => false;
  mainInitialized = false;
}

export function isDatadogAvailableInMain(): boolean {
  const { applicationId, clientToken } = getDatadogBuildConfig();
  return getOperatingSystemSupportStatus().supported && !!applicationId && !!clientToken;
}

/**
 * Initialize Datadog in the main process (standalone, like Sentry but with DatadogId).
 * Call at app.ready only when user.datadogId exists in db (same segment as renderer, no app userId).
 * Registers uncaughtException/unhandledRejection. When the renderer window exists, errors are
 * forwarded via IPC; when it does not (crash before boot), we only console.error (no RUM send from main).
 */
export function initDatadogMain(shouldSend: () => boolean, datadogIdFromDb: string): void {
  if (mainInitialized) return;
  if (!isDatadogAvailableInMain()) return;
  if (!datadogIdFromDb || typeof datadogIdFromDb !== "string") return;

  shouldSendCallback = shouldSend;
  mainInitialized = true;

  uncaughtExceptionListener = (error: Error) => {
    captureExceptionMain(error);
  };
  unhandledRejectionListener = (reason: unknown) => {
    const message = typeof reason === "string" ? reason : String(reason);
    const error = reason instanceof Error ? reason : new Error(message);
    captureExceptionMain(error);
  };
  process.on("uncaughtException", uncaughtExceptionListener);
  process.on("unhandledRejection", unhandledRejectionListener);
}

/**
 * Capture an error from the main process and send it to Datadog.
 * Respects sentryLogs (shouldSend) and the same ignore list as the renderer (parity with Sentry).
 * If the renderer window exists, forwards via IPC (renderer sends via RUM). Otherwise logs with console.error.
 */
export function captureExceptionMain(error: Error): void {
  if (!shouldSendCallback()) return;
  if (shouldIgnoreErrorMessage(error.message)) return;

  const w = getMainWindow();
  if (w && !w.isDestroyed() && w.webContents) {
    sendMainErrorToRenderer(error);
    return;
  }

  // No window (e.g. crash before renderer boot): just log; Datadog Browser SDK does not support main process.
  console.error("[Datadog main] Error (no renderer window):", error);
}

/**
 * Forward a main process error to the renderer so it can be sent as a RUM event.
 */
export function sendMainErrorToRenderer(error: Error): void {
  const w = getMainWindow();
  if (w && !w.isDestroyed() && w.webContents) {
    w.webContents.send(MAIN_ERROR_IPC_CHANNEL, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
}
