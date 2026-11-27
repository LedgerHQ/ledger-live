import type { RumBeforeSend, RumEvent, TrackingConsent } from "@datadog/electron-sdk";
import { DatadogId, shouldUsePersistedId } from "@domain/entity-client-identity";
import { app, crashReporter } from "electron";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { scrubResourceUrl } from "@features/platform-observability-redaction";
import { log as ledgerLog } from "@ledgerhq/logs";
import { shouldIgnoreErrorMessage } from "./ignoreErrors";
import { blankStrings } from "./blankStrings";

const log = (message: string, data?: unknown) => ledgerLog("datadog-main", message, data);

const MAX_PENDING_CAPTURES = 50;

export type ConsentCallback = () => TrackingConsent;
type UserCallback = () => DatadogId | undefined;

const field = (value: unknown, key: string): unknown =>
  value !== null && typeof value === "object" ? Reflect.get(value, key) : undefined;
const isRate = (value: unknown): value is number =>
  typeof value === "number" && value >= 0 && value <= 100;

// The lldDatadog flag as the renderer last persisted it: the SDK only takes its sampling at init.
export function parseMainDatadogSettings(value: unknown) {
  const enabled = field(value, "enabled");
  const sessionSampleRate = field(value, "sessionSampleRate");
  const profilingSampleRate = field(value, "profilingSampleRate");
  return {
    enabled: typeof enabled === "boolean" ? enabled : undefined,
    sessionSampleRate: isRate(sessionSampleRate) ? sessionSampleRate : undefined,
    profilingSampleRate: isRate(profilingSampleRate) ? profilingSampleRate : undefined,
  };
}
export type MainDatadogSettings = ReturnType<typeof parseMainDatadogSettings>;
type PendingCapture = { err: unknown; capturedAt: number; uncaught: boolean };

// Loaded by init only: a launch without consent never loads it, nor fails on it.
let sdk: typeof import("@datadog/electron-sdk") | undefined;
// Loaded by init too: the main build aliases ~/renderer/bridge, whose paths these read once loaded.
let config: typeof import("./config") | undefined;
let anonymizer: (typeof import("./anonymizer"))["default"] | undefined;
let initialized = false;
let initPromise: Promise<boolean> | null = null;
let getConsent: ConsentCallback = () => "not-granted";
let appliedConsent: TrackingConsent = "not-granted";
let pendingCaptures: PendingCapture[] = [];
// Buffers from module load: setup.ts installs the crash handlers long before app "ready".
let bufferingBeforeInit = true;

export function __resetDatadogMainForTesting(): void {
  sdk = undefined;
  config = undefined;
  anonymizer = undefined;
  initialized = false;
  initPromise = null;
  getConsent = () => "not-granted";
  appliedConsent = "not-granted";
  pendingCaptures = [];
  bufferingBeforeInit = true;
}

// Asar frames are rewritten before anonymizing, so frames of home-dir installs still resolve.
const hasBuildConfig = () => !!__DATADOG_APPLICATION_ID__ && !!__DATADOG_CLIENT_TOKEN__;

function scrubEvent(event: RumEvent, source: string): void {
  if (!config || !anonymizer) throw new Error("scrubbing before init");
  const { rewriteAsarUrls, toDatadogStackFrames } = config;
  const toFrames = (stack: string): string => toDatadogStackFrames(rewriteAsarUrls(stack));
  if (event.type === "error") {
    event.error.message = rewriteAsarUrls(event.error.message);
    if (event.error.stack) event.error.stack = toFrames(event.error.stack);
    if (event.error.handling_stack)
      event.error.handling_stack = toFrames(event.error.handling_stack);
  }
  event.context = { ...event.context, git_commit: __GIT_REVISION__, process: source };
  // Every string the SDK lets us edit: messages, headers, scripts, context.
  anonymizer.filepathRecursiveReplacer({ event });
  if (event.type === "resource") event.resource.url = scrubResourceUrl(event.resource.url);
  if (event.type === "error" && event.error.resource) {
    event.error.resource.url = scrubResourceUrl(event.error.resource.url);
  }
  // Main events attach to an execution context and may carry no view.
  if (event.view?.url) event.view.url = scrubResourceUrl(event.view.url);
  if (event.view?.referrer) event.view.referrer = scrubResourceUrl(event.view.referrer);
  // Named after the webContents URL, Live App <webview> guests included.
  if (event.execution_context?.name) {
    event.execution_context.name = scrubResourceUrl(event.execution_context.name);
  }
}

export const beforeSendMain: RumBeforeSend = (event, { source }) => {
  try {
    const ignored = event.type === "error" && shouldIgnoreErrorMessage(event.error.message);
    // Scrubbed even when ignored: crash events cannot be discarded.
    scrubEvent(event, source);
    return !ignored;
  } catch (e) {
    log("beforeSendRum scrub failed", e);
    // View, execution context and crash events cannot be discarded either.
    blankStrings(event);
    return false;
  }
};

export function initDatadogMain(
  consent: ConsentCallback,
  settings: MainDatadogSettings,
  user: UserCallback,
): Promise<boolean> {
  if (initialized) return Promise.resolve(true);
  initPromise ??= doInitDatadogMain(consent, settings, user).finally(() => {
    initPromise = null;
    bufferingBeforeInit = false;
    const queued = pendingCaptures;
    pendingCaptures = [];
    queued.forEach(captureOrBuffer);
  });
  return initPromise;
}

async function doInitDatadogMain(
  consent: ConsentCallback,
  settings: MainDatadogSettings,
  user: UserCallback,
): Promise<boolean> {
  if (!hasBuildConfig()) return false;
  try {
    config = await import(/* webpackMode: "eager" */ "./config");
    anonymizer = (await import(/* webpackMode: "eager" */ "./anonymizer")).default;
    const { applicationId, clientToken, site, service, env } = config.getDatadogBuildConfig();
    if (!applicationId || !clientToken) return false;
    sdk = await import("@datadog/electron-sdk");
    const ok = await sdk.init({
      applicationId,
      clientToken,
      site,
      service,
      env,
      version: __APP_VERSION__,
      // The renderer reports on its own, with its Browser SDK: no page bridges through main.
      allowedRendererHosts: [],
      sessionSampleRate: settings.sessionSampleRate,
      // SDK telemetry skips beforeSendRum, so its stacks would leak unanonymized paths.
      telemetrySampleRate: 0,
      // Kept on disk until the consent read once init() is done: an opt-out meanwhile discards it.
      trackingConsent: "pending",
      beforeSendRum: beforeSendMain,
    });
    if (!ok) return false;
    getConsent = consent;
    appliedConsent = "pending";
    initialized = true;
    // Before the buffered errors go out, so they are not sent under a user the SDK kept from before.
    setUserIdMain(user());
    syncTrackingConsentMain();
    return true;
  } catch (e) {
    log("init threw", e);
    return false;
  }
}

// Only the .dmp files the SDK uploads, leaving the database of the running Crashpad handler.
function deleteCrashDumps(): void {
  try {
    const dir = app.getPath("crashDumps");
    for (const file of readdirSync(dir, { recursive: true, encoding: "utf8" })) {
      if (file.endsWith(".dmp")) rmSync(path.join(dir, file), { force: true });
    }
  } catch (e) {
    log("could not delete crash dumps", e);
  }
}

// For a launch that will not init: drops held errors, and the dumps written before and during it.
export function skipDatadogMain(): void {
  bufferingBeforeInit = false;
  pendingCaptures = [];
  if (!hasBuildConfig()) return;
  deleteCrashDumps();
  app.once("will-quit", deleteCrashDumps);
}

// Before "ready": init() is too late for the processes already spawned, the first window's included.
export function startCrashReporterMain(): void {
  if (!hasBuildConfig()) return;
  // Same options as the SDK's own start in init().
  crashReporter.start({ uploadToServer: false, ignoreSystemCrashHandler: true });
  // init() starts it again, while Electron documents a single start.
  crashReporter.start = () => {};
}

// Never throws: also runs at the end of init, which then counts as done.
export function syncTrackingConsentMain(): void {
  if (!initialized) return;
  try {
    const consent = getConsent();
    if (consent === appliedConsent) return;
    const leavingInitPending = appliedConsent === "pending" && consent === "granted";
    appliedConsent = consent;
    sdk?.setTrackingConsent(consent);
    // On an opt-out, and on a re-grant: its dumps were written while opted out.
    if (!leavingInitPending) deleteCrashDumps();
  } catch (e) {
    log("setTrackingConsent threw", e);
  }
}

// Sent at the current time: one older than this launch's session would be dropped or misfiled.
function report({ err, capturedAt, uncaught }: PendingCapture): void {
  try {
    sdk?.addError(err, { context: { captured_at: capturedAt, ...(uncaught && { uncaught }) } });
  } catch (e) {
    log("addError threw", e);
  }
}

function captureOrBuffer(capture: PendingCapture): void {
  if (initialized) {
    report(capture);
    return;
  }
  if ((bufferingBeforeInit || initPromise) && pendingCaptures.length < MAX_PENDING_CAPTURES) {
    pendingCaptures.push(capture);
  }
}

// After init the SDK collects them; one raised while init() runs may also reach it, a rare duplicate.
export function bufferUncaughtErrorMain(err: unknown): void {
  if (!initialized) captureOrBuffer({ err, capturedAt: Date.now(), uncaught: true });
}

// Never throws: also called from uncaughtException/unhandledRejection handlers.
export function captureExceptionMain(err: unknown): void {
  captureOrBuffer({ err, capturedAt: Date.now(), uncaught: false });
}

// The SDK keeps the user across launches: an id that is gone must be cleared. Never throws.
export function setUserIdMain(datadogId: DatadogId | undefined): void {
  if (!initialized) return;
  try {
    if (datadogId) sdk?.setUserInfo({ id: datadogId.exportDatadogIdForElectronMain() });
    else sdk?.clearUserInfo();
  } catch (e) {
    log("setUserInfo threw", e);
  }
}

// Never throws, so Datadog cannot fail the db write or reset that triggered it.
const readDatadogId = (identities: unknown): DatadogId | undefined => {
  try {
    const id = field(identities, "datadogId");
    return typeof id === "string" && shouldUsePersistedId(id)
      ? DatadogId.fromString(id)
      : undefined;
  } catch {
    return undefined;
  }
};

// Main's own copy of the gate, small enough to read before "ready", unlike the whole app db.
const GATE_FILE = "datadog-gate.json";

// Consent from the gate main kept, then from the renderer's direct db writes (past its debounce).
export function createDatadogMainState(userDataDirectory: string) {
  const gateFile = path.join(userDataDirectory, GATE_FILE);
  let gate: unknown;
  try {
    gate = JSON.parse(readFileSync(gateFile, "utf8"));
  } catch {
    gate = undefined;
  }
  const datadogSettings = parseMainDatadogSettings(field(gate, "lldDatadog"));
  let lldDatadog = datadogSettings;
  // On when unset, as in the renderer; the flag stays unknown until the renderer reports it.
  let crashReporting = field(gate, "crashReporting") !== false;
  const persistGate = () => {
    try {
      writeFileSync(gateFile, JSON.stringify({ crashReporting, lldDatadog }));
    } catch (e) {
      log("could not persist the gate", e);
    }
  };
  let datadogId: DatadogId | undefined;
  const setIdentities = (identities: unknown) => {
    datadogId = readDatadogId(identities);
    setUserIdMain(datadogId);
  };
  const consent = (): TrackingConsent =>
    crashReporting && lldDatadog.enabled === true ? "granted" : "not-granted";
  return {
    settings: datadogSettings,
    consent,
    profilesRenderer: () =>
      consent() === "granted" && (datadogSettings.profilingSampleRate ?? 0) > 0,
    user: () => datadogId,
    setIdentities,
    onAppKeyWritten(keyPath: string, value: unknown) {
      if (keyPath === "identities") setIdentities(value);
      if (keyPath === "lldDatadog") lldDatadog = parseMainDatadogSettings(value);
      if (keyPath === "settings.crashReporting") crashReporting = value !== false;
      if (keyPath === "lldDatadog" || keyPath === "settings.crashReporting") persistGate();
      syncTrackingConsentMain();
    },
  };
}

// Not app bugs: a clean close, or the OS killing or evicting a renderer (logoff, memory pressure).
const UNREPORTED_RENDER_GONE_REASONS = new Set(["clean-exit", "killed", "memory-eviction"]);

// App windows only: Live App <webview> guests crashing are not LLD errors.
export function reportRenderProcessGoneMain(
  webContentsType: string,
  { reason, exitCode }: { reason: string; exitCode: number },
): void {
  if (UNREPORTED_RENDER_GONE_REASONS.has(reason) || webContentsType !== "window") return;
  captureExceptionMain(new Error(`render-process-gone: ${reason} (exit ${exitCode})`));
}
