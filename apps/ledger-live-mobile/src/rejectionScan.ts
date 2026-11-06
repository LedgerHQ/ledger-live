// TEST-BRANCH ONLY (LIVE-39321): records every unhandled promise rejection in e2e builds.
// Each one is printed as one JSON line (logcat / device log) and sent to the e2e runner over the
// bridge, which writes e2e/mobile/artifacts/unhandled-rejections-*.jsonl. Do not merge.
import Config from "react-native-config";

const MARKER = "[UNHANDLED_REJECTION]";
const HANDLED_MARKER = "[REJECTION_HANDLED]";
const READY_MARKER = "[REJECTION_SCAN_READY]";
const CANARY_MESSAGE = "rejection-scan-canary";
const MAX_STACK_LENGTH = 2500;
const MAX_MESSAGE_LENGTH = 500;
const MAX_PENDING = 500;

type RejectionKind = "ready" | "unhandled" | "handled";

export type RejectionRecord = {
  kind: RejectionKind;
  id?: number;
  at: number;
  name?: string;
  message?: string;
  stack?: string;
  ok?: boolean;
  reason?: string;
};

/** Returns false when the record could not be delivered yet; it then stays queued. */
export type RejectionSink = (record: RejectionRecord) => boolean;

type HermesTrackerOptions = {
  allRejections: boolean;
  onUnhandled: (id: number, rejection?: unknown) => void;
  onHandled: (id: number) => void;
};

type HermesInternalType = {
  enablePromiseRejectionTracker?: (options: HermesTrackerOptions) => void;
};

const MARKERS: Record<RejectionKind, string> = {
  ready: READY_MARKER,
  unhandled: MARKER,
  handled: HANDLED_MARKER,
};

let pending: RejectionRecord[] = [];
let sink: RejectionSink | null = null;

function describe(rejection: unknown): Pick<RejectionRecord, "name" | "message" | "stack"> {
  if (rejection instanceof Error) {
    return {
      name: rejection.name,
      message: rejection.message.slice(0, MAX_MESSAGE_LENGTH),
      stack: (rejection.stack ?? "").slice(0, MAX_STACK_LENGTH),
    };
  }
  let message: string;
  try {
    message = typeof rejection === "string" ? rejection : JSON.stringify(rejection);
  } catch {
    message = String(rejection);
  }
  return {
    name: typeof rejection,
    message: String(message).slice(0, MAX_MESSAGE_LENGTH),
    stack: "",
  };
}

/** Sends queued records through the sink; keeps the ones it could not deliver. */
export function flushRejections(): void {
  if (!sink) return;
  const deliver = sink;
  pending = pending.filter(record => !deliver(record));
}

/** Called by the e2e bridge client once its WebSocket is open. */
export function setRejectionSink(next: RejectionSink | null): void {
  sink = next;
  flushRejections();
}

function record(entry: RejectionRecord): void {
  // console.error: release builds drop lower log levels on iOS (RCTLogLevelError threshold).
  // eslint-disable-next-line no-console
  console.error(`${MARKERS[entry.kind]} ${JSON.stringify(entry)}`);
  pending = [...pending, entry].slice(-MAX_PENDING);
  flushRejections();
}

export function installRejectionScan(): void {
  if (Config.DETOX !== "1") return;
  const hermes = (global as { HermesInternal?: HermesInternalType }).HermesInternal;
  if (!hermes?.enablePromiseRejectionTracker) {
    record({
      kind: "ready",
      at: Date.now(),
      ok: false,
      reason: "HermesInternal.enablePromiseRejectionTracker missing",
    });
    return;
  }
  hermes.enablePromiseRejectionTracker({
    allRejections: true,
    onUnhandled: (id, rejection) =>
      record({ kind: "unhandled", id, at: Date.now(), ...describe(rejection) }),
    onHandled: id => record({ kind: "handled", id, at: Date.now() }),
  });
  record({ kind: "ready", at: Date.now(), ok: true });
  void Promise.reject(new Error(CANARY_MESSAGE));
}

installRejectionScan();
