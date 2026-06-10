import { addError, init } from "@datadog/electron-sdk";
import anonymizer from "~/sentry/anonymizer";
import { getOperatingSystemSupportStatus } from "~/support/os";
import {
  getDatadogBuildConfig,
  rewriteAsarUrls,
  toDatadogStackFrames,
  type ShouldSendCallback,
} from "./config";
import { shouldIgnoreErrorMessage } from "./ignoreErrors";

type ContextValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ContextValue[]
  | { [key: string]: ContextValue };
type Context = { [key: string]: ContextValue };

let initialized = false;
let shouldSendCallback: ShouldSendCallback = () => true;
let globalContext: Context = {};

export function __resetDatadogMainForTesting(): void {
  initialized = false;
  shouldSendCallback = () => true;
  globalContext = {};
}

export function isDatadogMainAvailable(): boolean {
  const { applicationId, clientToken } = getDatadogBuildConfig();
  return getOperatingSystemSupportStatus().supported && !!applicationId && !!clientToken;
}

export async function initDatadogMain(
  shouldSend: ShouldSendCallback,
  context: Context = {},
): Promise<boolean> {
  if (initialized) return true;
  if (!shouldSend()) return false;

  const { applicationId, clientToken, site, service, env } = getDatadogBuildConfig();
  if (!applicationId || !clientToken) return false;
  if (!getOperatingSystemSupportStatus().supported) return false;

  try {
    const ok = await init({
      applicationId,
      clientToken,
      site,
      service,
      env,
      version: __APP_VERSION__,
    });
    if (!ok) return false;

    shouldSendCallback = shouldSend;
    globalContext = {
      git_commit: __GIT_REVISION__,
      process: "main",
      ...context,
    };
    initialized = true;
    return true;
  } catch (e) {
    console.error("Datadog Electron SDK init failed", e);
    return false;
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return String(err.message);
  }
  return "";
}

// Build a sanitized copy for Datadog instead of mutating the original Error, which may also be
// observed by Sentry/console. rewriteAsarUrls runs before anonymizer.filepath so the asar prefix
// (including any $HOME segment) is stripped first and frames still resolve for home-dir installs.
function sanitizeErrorForDatadog(err: unknown): unknown {
  if (!(err instanceof Error)) return err;
  const sanitized = new Error(anonymizer.filepath(err.message));
  sanitized.name = err.name;
  if (err.stack) {
    sanitized.stack = toDatadogStackFrames(anonymizer.filepath(rewriteAsarUrls(err.stack)));
  }
  return sanitized;
}

export function captureExceptionMain(err: unknown, context?: Context): void {
  if (!initialized) return;
  if (!shouldSendCallback()) return;
  if (shouldIgnoreErrorMessage(errorMessage(err))) return;

  try {
    const merged: Context = { ...globalContext, ...context };
    anonymizer.filepathRecursiveReplacer(merged);
    addError(sanitizeErrorForDatadog(err), { context: merged });
  } catch {
    // no-op
  }
}

export function setGlobalContextMain(context: Context): void {
  globalContext = { ...globalContext, ...context };
}

type RenderProcessGoneEmitter = {
  on(
    event: "render-process-gone",
    listener: (event: unknown, webContents: unknown, details: RenderProcessGoneDetails) => void,
  ): unknown;
};
type RenderProcessGoneDetails = { reason: string; exitCode: number };

// Forward main-process crash sources to Datadog. Call once, after initDatadogMain resolves true.
// `app` is injected (Electron's app) to keep this unit free of an electron runtime import.
// Renderer "clean-exit" is a normal shutdown, not a crash, so it is skipped.
export function installDatadogMainErrorHandlers(app: RenderProcessGoneEmitter): void {
  process.on("uncaughtException", err => captureExceptionMain(err));
  process.on("unhandledRejection", reason => captureExceptionMain(reason));
  app.on("render-process-gone", (_event, _webContents, details) => {
    if (details.reason === "clean-exit") return;
    captureExceptionMain(new Error(`render-process-gone: ${details.reason}`), {
      reason: details.reason,
      exitCode: details.exitCode,
    });
  });
}
