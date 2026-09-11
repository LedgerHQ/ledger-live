import { closeAndFlush, flush } from "./flush";
import { setAnalytics } from "./registry";
import type { Analytics } from "./types";

const createAnalyticsClient = ({
  flush: flushFn = jest.fn(async () => {}),
  closeAndFlush: closeAndFlushFn = jest.fn(async () => {}),
}: Partial<Analytics> = {}): jest.Mocked<Analytics> =>
  ({
    track: jest.fn(),
    flush: jest.fn(flushFn),
    closeAndFlush: jest.fn(closeAndFlushFn),
  }) as unknown as jest.Mocked<Analytics>;

beforeEach(() => {
  setAnalytics(undefined);
});

describe("flush", () => {
  it("delegates to the registered analytics client", async () => {
    const analytics = createAnalyticsClient();
    setAnalytics(analytics);

    await flush();

    expect(analytics.flush).toHaveBeenCalled();
  });

  it("awaits the analytics client promise", async () => {
    let resolveFlush: (() => void) | undefined;
    const analytics = createAnalyticsClient({
      flush: () =>
        new Promise<void>(resolve => {
          resolveFlush = resolve;
        }),
    });
    setAnalytics(analytics);

    let settled = false;
    const pending = flush();
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveFlush?.();
    await pending;
    settled = true;
    expect(settled).toBe(true);
  });

  it("resolves when no analytics client is registered", async () => {
    await expect(flush()).resolves.toBeUndefined();
  });

  it("resolves when the analytics client has no flush method", async () => {
    setAnalytics({ track: jest.fn() });

    await expect(flush()).resolves.toBeUndefined();
  });
});

describe("closeAndFlush", () => {
  it("delegates to the registered analytics client", async () => {
    const analytics = createAnalyticsClient();
    setAnalytics(analytics);

    await closeAndFlush();

    expect(analytics.closeAndFlush).toHaveBeenCalled();
  });

  it("awaits the analytics client promise", async () => {
    let resolveCloseAndFlush: (() => void) | undefined;
    const analytics = createAnalyticsClient({
      closeAndFlush: () =>
        new Promise<void>(resolve => {
          resolveCloseAndFlush = resolve;
        }),
    });
    setAnalytics(analytics);

    let settled = false;
    const pending = closeAndFlush();
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveCloseAndFlush?.();
    await pending;
    settled = true;
    expect(settled).toBe(true);
  });

  it("resolves when no analytics client is registered", async () => {
    await expect(closeAndFlush()).resolves.toBeUndefined();
  });

  it("resolves when the analytics client has no closeAndFlush method", async () => {
    setAnalytics({ track: jest.fn() });

    await expect(closeAndFlush()).resolves.toBeUndefined();
  });
});
