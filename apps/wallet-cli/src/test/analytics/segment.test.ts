import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const STATIC_IP = "0.0.0.0";

type AnalyticsCall = {
  userId?: unknown;
  event?: string;
  traits?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  context?: { ip?: string } & Record<string, unknown>;
};

const identifyCalls: AnalyticsCall[] = [];
const trackCalls: AnalyticsCall[] = [];

class MockAnalytics {
  constructor(_options: { writeKey: string }) {}
  identify(params: AnalyticsCall): void {
    identifyCalls.push(params);
  }
  track(params: AnalyticsCall): void {
    trackCalls.push(params);
  }
  closeAndFlush(): Promise<void> {
    return Promise.resolve();
  }
}

mock.module("@segment/analytics-node", () => ({
  Analytics: MockAnalytics,
}));

const { WALLET_CLI_USER_ID, startAnalytics, track, updateIdentify, disposeAnalytics } =
  await import("../../analytics/segment");

describe("wallet-cli analytics privacy", () => {
  beforeEach(() => {
    identifyCalls.length = 0;
    trackCalls.length = 0;
    startAnalytics();
  });

  afterEach(async () => {
    await disposeAnalytics();
  });

  it("uses a hard-coded UUID as the shared userId rather than a per-machine value", () => {
    expect(WALLET_CLI_USER_ID).toBe("f3c373cd-c661-46bb-8577-3bc2bce98b5b");
  });

  it("identifies on startup with the stable userId and a static IP", () => {
    expect(identifyCalls).toHaveLength(1);
    expect(identifyCalls[0].userId).toBe(WALLET_CLI_USER_ID);
    expect(identifyCalls[0].context?.ip).toBe(STATIC_IP);
  });

  it("tracks events with the stable userId and a static IP", () => {
    track("some-event");

    expect(trackCalls).toHaveLength(1);
    expect(trackCalls[0]).toMatchObject({
      userId: WALLET_CLI_USER_ID,
      event: "some-event",
      context: { ip: STATIC_IP },
    });
  });

  it("does not let caller-supplied properties override the userId or static IP", () => {
    track("some-event", {
      userId: "attacker-supplied-id",
      ip: "203.0.113.42",
      context: { ip: "203.0.113.42" },
    });

    expect(trackCalls[0].userId).toBe(WALLET_CLI_USER_ID);
    expect(trackCalls[0].context?.ip).toBe(STATIC_IP);
    expect(Object.keys(trackCalls[0].context ?? {})).toEqual(["ip"]);
  });
});
