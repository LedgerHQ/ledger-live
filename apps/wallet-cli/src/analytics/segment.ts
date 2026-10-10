import { Analytics, type IdentifyParams, type TrackParams } from "@segment/analytics-node";
import os from "node:os";
import { closeAndFlush, setAnalytics, setEnabledFn } from "@shared/analytics";
import pkg from "../../package.json" with { type: "json" };

export const WALLET_CLI_USER_ID = "f3c373cd-c661-46bb-8577-3bc2bce98b5b";
const WALLET_CLI_WRITE_KEY = process.env.SEGMENT_WRITE_KEY || "70VZSoB5kr9tiTHJMqKwxUjvZEPbrnBO";

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

/** The part of the Segment client wallet-cli uses; it ignores what identify and track return. */
type SegmentClient = {
  identify(params: IdentifyParams): void;
  track(params: TrackParams): void;
  closeAndFlush(): Promise<void>;
};

const createSegmentClient = (writeKey: string): SegmentClient => new Analytics({ writeKey });

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
        await segmentClient.closeAndFlush();
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

export async function disposeAnalytics(): Promise<void> {
  try {
    await closeAndFlush();
  } catch {
    // ignore
  } finally {
    unregisterAnalytics();
  }
}
