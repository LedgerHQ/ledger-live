import "@datadog/electron-sdk/instrument";
import { init } from "@datadog/electron-sdk";
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
  if (!shouldSend()) {
    console.log("[datadog/main] skipped: shouldSend() is false");
    return false;
  }

  const { applicationId, clientToken, site, service, env } = getDatadogBuildConfig();
  if (!applicationId || !clientToken) {
    console.log("[datadog/main] skipped: missing applicationId or clientToken");
    return false;
  }
  if (!getOperatingSystemSupportStatus().supported) {
    console.log("[datadog/main] skipped: OS not supported");
    return false;
  }

  try {
    const ok = await init({
      applicationId,
      clientToken,
      site,
      service,
      env,
      version: __APP_VERSION__,
    });
    if (!ok) {
      console.log("[datadog/main] init() returned false");
      return false;
    }

    shouldSendCallback = shouldSend;
    globalContext = {
      git_commit: __GIT_REVISION__,
      process: "main",
      ...context,
    };
    initialized = true;
    console.log("[datadog/main] initialized ✓");
    return true;
  } catch (e) {
    console.warn("[datadog/main] init threw:", e);
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

// dd-trace auto-captures console.error() calls and forwards them to Datadog
export function captureExceptionMain(err: unknown): void {
  if (!initialized) return;
  if (!shouldSendCallback()) return;
  if (shouldIgnoreErrorMessage(errorMessage(err))) return;
  console.error(anonymizeError(err));
}

export function setGlobalContextMain(context: Context): void {
  globalContext = { ...globalContext, ...context };
}
