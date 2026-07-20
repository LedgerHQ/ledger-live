import { addError, init } from "@datadog/electron-sdk";
import anonymizer from "~/sentry/anonymizer";
import { getOperatingSystemSupportStatus } from "~/support/os";
import { getDatadogBuildConfig, rewriteAsarUrls, type ShouldSendCallback } from "./config";
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
    console.warn("Datadog Electron SDK init failed", e);
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

// Returns a non-mutating anonymized clone; also normalizes non-Error rejections to Error.
function anonymizeError(err: unknown): Error {
  const original = err instanceof Error ? err : new Error(errorMessage(err));
  const clone = new Error(rewriteAsarUrls(anonymizer.filepath(original.message)));
  if (original.stack) clone.stack = rewriteAsarUrls(anonymizer.filepath(original.stack));
  return clone;
}

export function captureExceptionMain(err: unknown, context?: Context): void {
  if (!initialized) return;
  if (!shouldSendCallback()) return;
  if (shouldIgnoreErrorMessage(errorMessage(err))) return;

  try {
    const merged: Context = { ...globalContext, ...context };
    anonymizer.filepathRecursiveReplacer(merged);
    addError(anonymizeError(err), { context: merged });
  } catch {
    // no-op
  }
}

export function setGlobalContextMain(context: Context): void {
  globalContext = { ...globalContext, ...context };
}
