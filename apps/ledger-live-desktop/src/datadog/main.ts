import { init, addError, setUserInfo } from "@datadog/electron-sdk";
import type { DatadogId } from "@domain/entity-client-identity";
import makeDebug from "debug";
import anonymizer from "~/datadog/anonymizer";
import { getOperatingSystemSupportStatus } from "~/support/os";
import {
  getDatadogBuildConfig,
  rewriteAsarUrls,
  toDatadogStackFrames,
  type ShouldSendCallback,
} from "./config";
import { shouldIgnoreErrorMessage } from "./ignoreErrors";

const log = makeDebug("ll:datadog:main");

type ContextValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ContextValue[]
  | { [key: string]: ContextValue };
type Context = { [key: string]: ContextValue };

const MAX_PENDING_CAPTURES = 50;

let initialized = false;
let initPromise: Promise<boolean> | null = null;
let shouldSendCallback: ShouldSendCallback = () => true;
let globalContext: Context = {};
let pendingCaptures: unknown[] = [];
let bufferingBeforeInit = false;

export function __resetDatadogMainForTesting(): void {
  initialized = false;
  initPromise = null;
  shouldSendCallback = () => true;
  globalContext = {};
  pendingCaptures = [];
  bufferingBeforeInit = false;
}

// Call as early as possible (before any window/renderer exists) alongside registering the
// render-process-gone listener, so crashes during startup queue instead of being dropped for
// having no init attempt in flight yet. Stops buffering once the first init attempt settles.
export function beginPreInitBufferingMain(): void {
  bufferingBeforeInit = true;
}

export function isDatadogMainAvailable(): boolean {
  const { applicationId, clientToken } = getDatadogBuildConfig();
  return getOperatingSystemSupportStatus().supported && !!applicationId && !!clientToken;
}

export function initDatadogMain(
  shouldSend: ShouldSendCallback,
  context: Context = {},
): Promise<boolean> {
  if (initialized) return Promise.resolve(true);
  initPromise ??= doInitDatadogMain(shouldSend, context).finally(() => {
    initPromise = null;
    bufferingBeforeInit = false;
    const queued = pendingCaptures;
    pendingCaptures = [];
    queued.forEach(captureExceptionMain);
  });
  return initPromise;
}

async function doInitDatadogMain(
  shouldSend: ShouldSendCallback,
  context: Context,
): Promise<boolean> {
  if (!shouldSend()) {
    log("skipped: opt-in / feature-flag gate is false");
    return false;
  }

  const { applicationId, clientToken, site, service, env } = getDatadogBuildConfig();
  log(
    "config: applicationId=%s site=%s service=%s env=%s version=%s",
    applicationId ? "[set]" : "[missing]",
    site,
    service,
    env,
    __APP_VERSION__,
  );

  if (!applicationId || !clientToken) {
    log("skipped: missing applicationId or clientToken");
    return false;
  }
  if (!getOperatingSystemSupportStatus().supported) {
    log("skipped: OS not supported (%s)", process.platform);
    return false;
  }

  try {
    log("calling init()...");
    const ok = await init({
      applicationId,
      clientToken,
      site,
      service,
      env,
      version: __APP_VERSION__,
      allowedRendererHosts: ["file://"],
    });
    if (!ok) {
      log("init() returned false");
      return false;
    }

    shouldSendCallback = shouldSend;
    globalContext = {
      git_commit: __GIT_REVISION__,
      process: "main",
      ...context,
    };
    initialized = true;
    log("initialized ✓ context=%o", globalContext);
    return true;
  } catch (e) {
    log("init threw: %o", e);
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

// Order matters: rewriteAsarUrls before anonymizer.filepath, so frames still resolve for home-dir installs.
function anonymizeError(err: unknown): Error {
  const original = err instanceof Error ? err : new Error(errorMessage(err));
  const clone = new Error(anonymizer.filepath(rewriteAsarUrls(original.message)));
  clone.name = original.name;
  if (original.stack) {
    clone.stack = toDatadogStackFrames(anonymizer.filepath(rewriteAsarUrls(original.stack)));
  }
  return clone;
}

// Called from uncaughtException/unhandledRejection handlers: a throw from here would escape
// uncaught, which Node does not protect against, so any SDK failure must never propagate.
export function captureExceptionMain(err: unknown): void {
  if (!initialized) {
    if ((bufferingBeforeInit || initPromise) && pendingCaptures.length < MAX_PENDING_CAPTURES) {
      pendingCaptures.push(err);
    }
    return;
  }
  if (!shouldSendCallback()) return;
  if (shouldIgnoreErrorMessage(errorMessage(err))) return;
  try {
    const anonymized = anonymizeError(err);
    log("reporting error: %s", anonymized.message);
    addError(anonymized, { context: globalContext });
  } catch (e) {
    log("addError threw: %o", e);
  }
}

export function setGlobalContextMain(context: Context): void {
  globalContext = { ...globalContext, ...context };
}

export function setUserIdMain(datadogId: DatadogId): void {
  if (!initialized) return;
  if (!shouldSendCallback()) return;
  setUserInfo({ id: datadogId.exportDatadogIdForElectronMain() });
}
