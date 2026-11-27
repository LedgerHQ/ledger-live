import { scrubResourceUrl } from "@features/platform-observability-redaction";
import anonymizer from "~/datadog/anonymizer";
import { scrubActionTargetName, scrubAutoActionName, scrubViewUrl } from "./scrubRum";
import { shouldIgnoreErrorMessage } from "./ignoreErrors";
import { blankStrings } from "./blankStrings";

export type ShouldSendCallback = () => boolean;

const VIEW_URL_KEYS = ["url", "referrer"] as const;
const LOCAL_APP_URL = /^(?:file:|https:\/\/app\.asar\/)/;

function getEventMessage(ev: Record<string, unknown>): string {
  if (ev.error && typeof ev.error === "object") {
    const errObj = ev.error as Record<string, unknown>;
    if (typeof errObj.message === "string") return errObj.message;
  }
  if (typeof ev.message === "string") return ev.message;
  return "";
}

// Datadog matches source maps by service+version+file under the "app.asar" domain and only
// unminifies https://{domain}{file} frames, so rewrite the local asar prefix to "https://app.asar/".
// ASAR_FILE_URL: renderer (Browser SDK) file:// URLs; ASAR_RAW_PATH: raw filesystem paths, which may
// contain spaces, hence anchoring on the "(" / "at " frame delimiter.
const ASAR_FILE_URL = /file:\/\/\/?[^\s'"()]*?app\.asar\//g;
const ASAR_RAW_PATH = /(\(|\bat )(?:\/|[A-Za-z]:[\\/])[^()\n]*?app\.asar[\\/]([^():\n]*)/g;

export function rewriteAsarUrls(text: string): string {
  return text
    .replace(ASAR_FILE_URL, "https://app.asar/")
    .replace(
      ASAR_RAW_PATH,
      (_, frameStart: string, file: string) =>
        `${frameStart}https://app.asar/${file.replaceAll("\\", "/")}`,
    );
}

// Reshapes raw V8 frames (`at {fn} ({url})`) into the `@` shape Datadog unminifies.
export function toDatadogStackFrames(stack: string): string {
  return stack.split("\n").map(reshapeStackFrame).join("\n");
}

function reshapeStackFrame(line: string): string {
  const afterIndent = line.trimStart();
  if (!afterIndent.startsWith("at ")) return line;
  const body = afterIndent.slice(3);
  if (body.includes(" @ ")) return line;
  const indent = line.slice(0, line.length - afterIndent.length);
  const frame = body.trimEnd();
  // A message line such as "at least 2 inputs" is no frame: frames end with a location.
  if (!/(:\d+:\d+\)?|\((native|<anonymous>)\))$/.test(frame)) return line;
  const open = matchingOpenParen(frame);
  if (open >= 1 && frame[open] === " " && frame[open + 1] === "(" && frame.endsWith(")")) {
    const loc = frame.slice(open + 2, -1);
    if (loc.length > 0) return `${indent}at ${frame.slice(0, open)} @ ${loc}`;
  }
  return `${indent}at <anonymous> @ ${frame}`;
}

// By paren depth, so eval frames' nested parens don't split the frame too early.
function matchingOpenParen(frame: string): number {
  if (!frame.endsWith(")")) return -1;
  let depth = 0;
  for (let i = frame.length - 1; i >= 0; i--) {
    if (frame[i] === ")") depth++;
    else if (frame[i] === "(") {
      depth--;
      if (depth === 0) return i - 1;
    }
  }
  return -1;
}

function rewriteAsarUrlsRecursive(value: unknown, seen: Set<object>): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  const obj = value as Record<string, unknown>;
  for (const k in obj) {
    if (!Object.hasOwn(obj, k)) continue;
    const v = obj[k];
    if (typeof v === "string") obj[k] = rewriteAsarUrls(v);
    else rewriteAsarUrlsRecursive(v, seen);
  }
}

function scrubEvent(ev: Record<string, unknown>): void {
  if ("server_name" in ev) delete ev.server_name;

  anonymizer.filepathRecursiveReplacer(ev);

  try {
    rewriteAsarUrlsRecursive(ev, new Set());
  } catch (e) {
    console.warn("Datadog: asar URL rewrite failed (best-effort):", e);
  }

  const resource = ev.resource as Record<string, unknown> | undefined;
  if (resource && typeof resource.url === "string") {
    resource.url = LOCAL_APP_URL.test(resource.url)
      ? scrubViewUrl(resource.url)
      : scrubResourceUrl(resource.url);
  }

  const action = ev.action as Record<string, unknown> | undefined;
  const target = action?.target as Record<string, unknown> | undefined;
  if (target && typeof target.name === "string") {
    const isCustomAction = action?.type === "custom";
    target.name = isCustomAction
      ? scrubActionTargetName(target.name)
      : scrubAutoActionName(target.name);
  }

  const view = ev.view as Record<string, unknown> | undefined;
  for (const key of VIEW_URL_KEYS) {
    const viewUrl = view?.[key];
    if (view && typeof viewUrl === "string") view[key] = scrubViewUrl(viewUrl);
  }
}

export function buildBeforeSend(shouldSend: ShouldSendCallback) {
  return (event: unknown, _context?: unknown): boolean => {
    if (typeof event !== "object" || event === null) return shouldSend();

    const ev = event as Record<string, unknown>;
    const message = getEventMessage(ev);

    try {
      scrubEvent(ev);
    } catch {
      blankStrings(ev);
      return false;
    }

    if (!shouldSend()) return false;
    return !(message && shouldIgnoreErrorMessage(message));
  };
}

export function getDatadogBuildConfig(): {
  applicationId: string | null | undefined;
  clientToken: string | null | undefined;
  site: string;
  service: string;
  env: string;
} {
  return {
    applicationId: __DATADOG_APPLICATION_ID__,
    clientToken: __DATADOG_CLIENT_TOKEN__,
    site: __DATADOG_SITE__ ?? "datadoghq.eu",
    service: "ledger-live-desktop",
    env: __DATADOG_ENV__ ?? (__DEV__ ? "development" : "production"),
  };
}
