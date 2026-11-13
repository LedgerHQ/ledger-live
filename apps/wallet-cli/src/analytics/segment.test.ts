import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { track } from "@shared/analytics";
import {
  ANALYTICS_FLUSH_TIMEOUT_MS,
  WALLET_CLI_USER_ID,
  createSegmentClient,
  disposeAnalytics,
  startAnalytics,
} from "./segment";

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

class FakeSegmentClient {
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

describe("wallet-cli analytics privacy", () => {
  beforeEach(() => {
    identifyCalls.length = 0;
    trackCalls.length = 0;
    startAnalytics(() => new FakeSegmentClient());
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

  it("tracks events with the stable userId and a static IP", async () => {
    await track("some-event");

    expect(trackCalls).toHaveLength(1);
    expect(trackCalls[0]).toMatchObject({
      userId: WALLET_CLI_USER_ID,
      event: "some-event",
      context: { ip: STATIC_IP },
    });
  });

  it("does not let caller-supplied properties override the userId or static IP", async () => {
    await track("some-event", {
      userId: "attacker-supplied-id",
      ip: "203.0.113.42",
      context: { ip: "203.0.113.42" },
    });

    expect(trackCalls[0].userId).toBe(WALLET_CLI_USER_ID);
    expect(trackCalls[0].context?.ip).toBe(STATIC_IP);
    expect(Object.keys(trackCalls[0].context ?? {})).toEqual(["ip"]);
  });
});

const fakeClient = (closeAndFlush: (options?: { timeout?: number }) => Promise<void>) => () => ({
  identify: () => {},
  track: () => {},
  closeAndFlush,
});

describe("disposeAnalytics", () => {
  it("bounds Segment's own flush with the exit timeout", async () => {
    const closeAndFlushOptions: unknown[] = [];
    startAnalytics(
      fakeClient(async options => {
        closeAndFlushOptions.push(options);
      }),
    );

    await disposeAnalytics();

    expect(closeAndFlushOptions).toEqual([{ timeout: ANALYTICS_FLUSH_TIMEOUT_MS }]);
  });

  it("swallows a failed flush", async () => {
    startAnalytics(fakeClient(() => Promise.reject(new Error("network down"))));

    await expect(disposeAnalytics()).resolves.toBeUndefined();
  });
});

describe("Segment client", () => {
  it("aborts a request the server never answers within the request timeout", async () => {
    const requestTimeoutMs = 100;
    let abortedAfterMs: number | undefined;
    const server = Bun.serve({
      port: 0,
      fetch: req => {
        const receivedAt = Date.now();
        req.signal.addEventListener("abort", () => {
          abortedAfterMs = Date.now() - receivedAt;
        });
        return new Promise<Response>(() => {});
      },
    });
    try {
      const client = createSegmentClient("test-write-key", {
        host: `http://127.0.0.1:${server.port}`,
        requestTimeoutMs,
      });
      client.track({ userId: WALLET_CLI_USER_ID, event: "wallet_cli_test_event" });
      // Segment retries the aborted request until the flush gives up.
      await client.closeAndFlush({ timeout: 3 * requestTimeoutMs });

      const deadline = Date.now() + 10 * requestTimeoutMs;
      while (abortedAfterMs === undefined && Date.now() < deadline) {
        await Bun.sleep(10);
      }

      expect(abortedAfterMs).toBeDefined();
      expect(abortedAfterMs).toBeLessThan(5 * requestTimeoutMs);
    } finally {
      await server.stop(true);
    }
  });
});
