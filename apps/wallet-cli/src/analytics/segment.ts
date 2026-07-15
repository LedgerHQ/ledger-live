import { Analytics } from "@segment/analytics-node";
import os from "node:os";
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

type IdentifyParams = Parameters<Analytics["identify"]>[0];
type TrackParams = Parameters<Analytics["track"]>[0];

export type AnalyticsClient = {
  identify(params: IdentifyParams): void;
  track(params: TrackParams): void;
  closeAndFlush(): Promise<unknown>;
};

let analytics: AnalyticsClient | null = null;

export const startAnalytics = (): void => {
  if (analytics) return;

  try {
    analytics = new Analytics({ writeKey: WALLET_CLI_WRITE_KEY });
    analytics.identify({
      userId: WALLET_CLI_USER_ID,
      traits: extraProperties(),
      context: getContext(),
    });
  } catch {
    analytics = null;
  }
};

export const track = (eventName: string, properties?: Record<string, unknown> | null): void => {
  if (!analytics) return;

  analytics.track({
    userId: WALLET_CLI_USER_ID,
    event: eventName,
    properties: {
      ...extraProperties(),
      ...(properties ?? {}),
    },
    context: getContext(),
  });
};

export const updateIdentify = (traits?: Record<string, unknown>): void => {
  if (!analytics) return;

  analytics.identify({
    userId: WALLET_CLI_USER_ID,
    traits: {
      ...extraProperties(),
      ...(traits ?? {}),
    },
    context: getContext(),
  });
};

export async function disposeAnalytics(): Promise<void> {
  const current = analytics;
  analytics = null;
  try {
    await current?.closeAndFlush();
  } catch {
    // ignore
  }
}
