import { Analytics } from "@segment/analytics-node";
import os from "node:os";
import { closeAndFlush, setAnalytics, setEnabledFn } from "@shared/analytics";
import pkg from "../../package.json" with { type: "json" };

export const WALLET_CLI_USER_ID = "f3c373cd-c661-46bb-8577-3bc2bce98b5b";
const WALLET_CLI_WRITE_KEY = process.env.SEGMENT_WRITE_KEY || "70VZSoB5kr9tiTHJMqKwxUjvZEPbrnBO";
// Segment's default closeAndFlush timeout is 75 s, spent retrying while its API is unreachable.
export const ANALYTICS_FLUSH_TIMEOUT_MS = 2_500;

const osType = os.type();
const osVersion = os.release();

const getContext = () => ({
  ip: "0.0.0.0",
});

const extraProperties = () => ({
  appVersion: pkg.version,
  platform: "wallet-cli",
  osType,
  osVersion,
});

/** The part of the Segment client wallet-cli uses. */
type SegmentClient = Pick<Analytics, "identify" | "track" | "closeAndFlush">;

// The flush timeout does not abort an in-flight request, whose open socket keeps the process alive.
export const createSegmentClient = (writeKey: string, host?: string): SegmentClient =>
  new Analytics({
    writeKey,
    httpRequestTimeout: ANALYTICS_FLUSH_TIMEOUT_MS,
    ...(host ? { host } : {}),
  });

let client: unknown | null = null;

const unregisterAnalytics = (): void => {
  client = null;
  setAnalytics(undefined);
  setEnabledFn(undefined);
};

/** `createClient` lets tests record what reaches Segment instead of sending it. */
export const startAnalytics = (createClient = createSegmentClient): void => {
  if (client) return;

  try {
    const segmentClient = createClient(WALLET_CLI_WRITE_KEY);
    client = segmentClient;
    setEnabledFn(() => true);
    setAnalytics({
      track: (event, properties) =>
        segmentClient.track({
          userId: WALLET_CLI_USER_ID,
          event,
          properties: {
            ...extraProperties(),
            ...(properties ?? {}),
          },
          context: getContext(),
        }),
      closeAndFlush: async () => {
        await segmentClient.closeAndFlush({ timeout: ANALYTICS_FLUSH_TIMEOUT_MS });
      },
    });
    segmentClient.identify({
      userId: WALLET_CLI_USER_ID,
      traits: extraProperties(),
      context: getContext(),
    });
  } catch {
    unregisterAnalytics();
  }
};

const giveUpAfter = (ms: number): { promise: Promise<void>; cancel: () => void } => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<void>(resolve => {
    timer = setTimeout(resolve, ms);
    timer.unref?.();
  });
  return { promise, cancel: () => clearTimeout(timer) };
};

export async function disposeAnalytics(timeoutMs = ANALYTICS_FLUSH_TIMEOUT_MS): Promise<void> {
  const deadline = giveUpAfter(timeoutMs);
  try {
    await Promise.race([closeAndFlush(), deadline.promise]);
  } catch {
    // ignore
  } finally {
    deadline.cancel();
    unregisterAnalytics();
  }
}
