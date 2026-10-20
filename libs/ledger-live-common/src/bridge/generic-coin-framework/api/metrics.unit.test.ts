import { notSupported } from "@ledgerhq/coin-module-framework/api/index";
import {
  createCoinModuleCallTransmitter,
  DEFAULT_MAX_FAILURES_PER_KEY,
  DEFAULT_SYNC_PATH_SAMPLE_RATE,
  readCoinObservabilityConfig,
  toCoinObservabilityConfig,
  resetCoinModuleCallObservers,
  setCoinObservabilityConfigReader,
  setCoinModuleCallObserver,
  shouldTransmitCoinModuleCall,
  withMetrics,
  type CoinModuleCallEvent,
} from "./metrics";

describe("shouldTransmitCoinModuleCall", () => {
  const event = (method: string, status: CoinModuleCallEvent["status"]): CoinModuleCallEvent => ({
    method,
    network: "ripple",
    family: "xrp",
    durationMs: 1,
    status,
  });
  const never = () => 0.99;
  const always = () => 0;

  it("always transmits a failure, even on the sync path", () => {
    expect(shouldTransmitCoinModuleCall(event("getBalance", "failure"), { random: never })).toBe(
      true,
    );
  });

  it.each(["craftTransaction", "estimateFees", "combine", "broadcast", "validateIntent"])(
    "always transmits a transaction-path call (%s)",
    method => {
      expect(shouldTransmitCoinModuleCall(event(method, "success"), { random: never })).toBe(true);
    },
  );

  it("samples sync-path successes", () => {
    expect(shouldTransmitCoinModuleCall(event("getBalance", "success"), { random: never })).toBe(
      false,
    );
    expect(shouldTransmitCoinModuleCall(event("getBalance", "success"), { random: always })).toBe(
      true,
    );
  });

  it("samples not-supported calls like successes", () => {
    expect(
      shouldTransmitCoinModuleCall(event("getStakes", "not_supported"), { random: never }),
    ).toBe(false);
  });

  it("honours a custom sync-path rate", () => {
    expect(
      shouldTransmitCoinModuleCall(event("listOperations", "success"), {
        syncPathSampleRate: 1,
        random: never,
      }),
    ).toBe(true);
  });
});

const labels = { network: "ripple", family: "xrp" };

// A loose module: only the methods a test exercises, plus a framework stub for an omitted one.
const makeApi = (overrides: Record<string, unknown> = {}) =>
  ({
    lastBlock: jest.fn().mockResolvedValue({ height: 1 }),
    combine: jest.fn().mockReturnValue("signed"),
    getStakes: notSupported("getStakes"),
    ...overrides,
  }) as any;

describe("createCoinModuleCallTransmitter", () => {
  const failure = (method = "getBalance", errorName = "NetworkDown"): CoinModuleCallEvent => ({
    method,
    network: "ripple",
    family: "xrp",
    durationMs: 1,
    status: "failure",
    errorName,
  });
  const config = { includeSyncPath: true, syncPathSampleRate: 0.1, maxFailuresPerKey: 2 };

  it("transmits nothing when the config reader returns null", () => {
    const transmit = createCoinModuleCallTransmitter(() => null);
    expect(transmit(failure())).toBe(false);
    expect(transmit({ ...failure("broadcast"), status: "success" })).toBe(false);
  });

  it("caps failures per method, currency and error name", () => {
    const transmit = createCoinModuleCallTransmitter(() => config, { clock: () => 0 });
    expect([transmit(failure()), transmit(failure()), transmit(failure())]).toEqual([
      true,
      true,
      false,
    ]);
    // Another key has its own budget.
    expect(transmit(failure("lastBlock"))).toBe(true);
    expect(transmit(failure("getBalance", "Timeout"))).toBe(true);
  });

  it("opens a new budget once the hour has passed", () => {
    let at = 0;
    const transmit = createCoinModuleCallTransmitter(() => config, { clock: () => at });
    transmit(failure());
    transmit(failure());
    expect(transmit(failure())).toBe(false);
    at = 60 * 60 * 1000;
    expect(transmit(failure())).toBe(true);
  });

  it("sends no failure when the cap is zero", () => {
    const transmit = createCoinModuleCallTransmitter(() => ({ ...config, maxFailuresPerKey: 0 }));
    expect(transmit(failure())).toBe(false);
  });

  it("applies the configured sample rate to sync-path successes", () => {
    const transmit = createCoinModuleCallTransmitter(
      () => ({ ...config, syncPathSampleRate: 0.5 }),
      { random: () => 0.4 },
    );
    expect(transmit({ ...failure(), status: "success" })).toBe(true);
  });

  it("sends nothing for sync-path methods, failures included, when the sync path is excluded", () => {
    const transmit = createCoinModuleCallTransmitter(
      () => ({ ...config, includeSyncPath: false, syncPathSampleRate: 1 }),
      { random: () => 0 },
    );
    expect(transmit(failure("getBalance"))).toBe(false);
    expect(transmit({ ...failure("listOperations"), status: "success" })).toBe(false);
  });

  it("keeps transaction-path calls, failures included, when the sync path is excluded", () => {
    const transmit = createCoinModuleCallTransmitter(
      () => ({ ...config, includeSyncPath: false }),
      {
        clock: () => 0,
      },
    );
    expect(transmit({ ...failure("broadcast"), status: "success" })).toBe(true);
    expect(transmit(failure("estimateFees"))).toBe(true);
  });

  it("still sends sync-path failures at a zero sample rate, unlike excluding the sync path", () => {
    const transmit = createCoinModuleCallTransmitter(() => ({ ...config, syncPathSampleRate: 0 }), {
      random: () => 0,
    });
    expect(transmit({ ...failure("getBalance"), status: "success" })).toBe(false);
    expect(transmit(failure("getBalance"))).toBe(true);
  });

  it("reads the config on every event, so a flag change applies at once", () => {
    let current: typeof config | null = config;
    const transmit = createCoinModuleCallTransmitter(() => current);
    expect(transmit({ ...failure("broadcast"), status: "success" })).toBe(true);
    current = null;
    expect(transmit({ ...failure("broadcast"), status: "success" })).toBe(false);
  });
});

describe("toCoinObservabilityConfig", () => {
  it("is null when the flag is absent or off", () => {
    expect(toCoinObservabilityConfig(undefined)).toBeNull();
    expect(toCoinObservabilityConfig(null)).toBeNull();
    expect(
      toCoinObservabilityConfig({
        enabled: false,
        params: { syncPathSampleRate: 1, maxFailuresPerKey: 1 },
      }),
    ).toBeNull();
  });

  it("uses the flag params when present", () => {
    expect(
      toCoinObservabilityConfig({
        enabled: true,
        params: { syncPathSampleRate: 0.3, maxFailuresPerKey: 7 },
      }),
    ).toEqual({ includeSyncPath: true, syncPathSampleRate: 0.3, maxFailuresPerKey: 7 });
  });

  it("falls back to each default when the flag is on without params", () => {
    expect(toCoinObservabilityConfig({ enabled: true })).toEqual({
      includeSyncPath: true,
      syncPathSampleRate: DEFAULT_SYNC_PATH_SAMPLE_RATE,
      maxFailuresPerKey: DEFAULT_MAX_FAILURES_PER_KEY,
    });
    expect(toCoinObservabilityConfig({ enabled: true, params: { maxFailuresPerKey: 0 } })).toEqual({
      includeSyncPath: true,
      syncPathSampleRate: DEFAULT_SYNC_PATH_SAMPLE_RATE,
      maxFailuresPerKey: 0,
    });
    expect(
      toCoinObservabilityConfig({ enabled: true, params: { includeSyncPath: false } }),
    ).toMatchObject({ includeSyncPath: false });
  });
});

describe("coin observability config reader", () => {
  afterEach(() => setCoinObservabilityConfigReader(null));

  it("reads null until a host injects a reader", () => {
    expect(readCoinObservabilityConfig()).toBeNull();
  });

  it("returns what the injected reader returns, and null again once cleared", () => {
    const config = { includeSyncPath: true, syncPathSampleRate: 0.2, maxFailuresPerKey: 3 };
    setCoinObservabilityConfigReader(() => config);
    expect(readCoinObservabilityConfig()).toBe(config);
    setCoinObservabilityConfigReader(null);
    expect(readCoinObservabilityConfig()).toBeNull();
  });
});

describe("withMetrics", () => {
  let events: CoinModuleCallEvent[];

  beforeEach(() => {
    events = [];
    setCoinModuleCallObserver(event => events.push(event));
  });

  afterEach(() => resetCoinModuleCallObservers());

  it("reports a successful async call with its labels and duration", async () => {
    const api = withMetrics(makeApi(), labels);

    await expect(api.lastBlock({}, "secret-address")).resolves.toEqual({ height: 1 });

    expect(events).toEqual([
      {
        method: "lastBlock",
        network: "ripple",
        family: "xrp",
        durationMs: expect.any(Number),
        status: "success",
      },
    ]);
  });

  it("reports a successful sync call without turning it into a promise", () => {
    const api = withMetrics(makeApi(), labels);

    expect(api.combine({}, "tx", "sig")).toBe("signed");
    expect(events).toEqual([expect.objectContaining({ method: "combine", status: "success" })]);
  });

  it("reports an async failure with its error name and category, and rethrows", async () => {
    const error = Object.assign(new Error("node down"), { name: "NetworkDown" });
    const api = withMetrics(makeApi({ lastBlock: jest.fn().mockRejectedValue(error) }), labels);

    await expect(api.lastBlock({})).rejects.toBe(error);

    expect(events).toEqual([
      expect.objectContaining({
        method: "lastBlock",
        status: "failure",
        errorName: "NetworkDown",
        errorCategory: expect.any(String),
      }),
    ]);
  });

  it("reports a sync failure and rethrows", () => {
    const error = new Error("bad signature");
    const combine = jest.fn(() => {
      throw error;
    });
    const api = withMetrics(makeApi({ combine }), labels);

    expect(() => api.combine({}, "tx", "sig")).toThrow(error);
    expect(events).toEqual([expect.objectContaining({ method: "combine", status: "failure" })]);
  });

  it("reports a call to an omitted capability as not supported, not as a failure", () => {
    const api = withMetrics(makeApi(), labels);

    expect(() => api.getStakes({}, "addr")).toThrow("getStakes is not supported");
    expect(events).toEqual([
      expect.objectContaining({ method: "getStakes", status: "not_supported", errorName: "Error" }),
    ]);
    expect(events[0].errorCategory).toBeUndefined();
  });

  it("never reports the arguments or the result", async () => {
    const api = withMetrics(makeApi(), labels);

    await api.lastBlock({}, "secret-address");

    expect(JSON.stringify(events)).not.toContain("secret-address");
    expect(JSON.stringify(events)).not.toContain("height");
  });

  it("does not break the call when an observer throws", async () => {
    setCoinModuleCallObserver(() => {
      throw new Error("sink down");
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const api = withMetrics(makeApi(), labels);

    await expect(api.lastBlock({})).resolves.toEqual({ height: 1 });

    expect(events).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("calls straight through when no observer is registered", async () => {
    resetCoinModuleCallObservers();
    const lastBlock = jest.fn().mockResolvedValue({ height: 1 });
    const api = withMetrics(makeApi({ lastBlock }), labels);

    await expect(api.lastBlock({})).resolves.toEqual({ height: 1 });
    expect(lastBlock).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(0);
  });

  it("keeps methods referentially stable", () => {
    const api = withMetrics(makeApi(), labels);

    expect(api.lastBlock).toBe(api.lastBlock);
  });

  it("stops reporting to an observer once unsubscribed", async () => {
    const observer = jest.fn();
    const unsubscribe = setCoinModuleCallObserver(observer);
    const api = withMetrics(makeApi(), labels);

    unsubscribe();
    await api.lastBlock({});

    expect(observer).not.toHaveBeenCalled();
  });
});
