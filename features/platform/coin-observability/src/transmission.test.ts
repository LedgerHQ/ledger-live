import { createCoinModuleCallTransmitter } from "./transmission";
import type { CoinModuleCallEvent } from "./coinModuleCall";

const event = (method: string, status: CoinModuleCallEvent["status"]): CoinModuleCallEvent => ({
  method,
  network: "ripple",
  family: "xrp",
  durationMs: 1,
  status,
});
const failure = (method = "getBalance", errorName = "NetworkDown"): CoinModuleCallEvent => ({
  method,
  network: "ripple",
  family: "xrp",
  durationMs: 1,
  status: "failure",
  errorName,
});
const call = (status: CoinModuleCallEvent["status"]): CoinModuleCallEvent => ({
  method: "getBalance",
  network: "ripple",
  family: "xrp",
  durationMs: 1,
  status,
  errorName: "NetworkDown",
});
/** The transmitter's decision as a boolean, for the tests about what is sent rather than how. */
const transmitter = (
  ...args: Parameters<typeof createCoinModuleCallTransmitter>
): ((event: CoinModuleCallEvent) => boolean) => {
  const transmit = createCoinModuleCallTransmitter(...args);
  return coinModuleCall => transmit(coinModuleCall) !== null;
};
const never = () => 0.99;
const always = () => 0;

describe("sampling attributes", () => {
  const config = {
    includeSyncPath: true,
    syncPathSampleRate: 0.05,
    preparationSampleRate: 0.1,
    maxFailuresPerKey: 5,
  };

  it("sends a sampled success with its tier's rate", () => {
    const transmit = createCoinModuleCallTransmitter(() => config, { random: () => 0.01 });
    expect(transmit(event("getBalance", "success"))).toEqual({
      tier: "sync",
      sampleRate: 0.05,
      inSample: true,
    });
    expect(transmit(event("estimateFees", "success"))).toEqual({
      tier: "preparation",
      sampleRate: 0.1,
      inSample: true,
    });
    expect(transmit(event("broadcast", "success"))).toEqual({
      tier: "transaction",
      sampleRate: 1,
      inSample: true,
    });
  });

  it("marks a failure from a session outside the sample", () => {
    const transmit = createCoinModuleCallTransmitter(() => config, {
      random: () => 0.5,
      clock: () => 0,
    });
    expect(transmit(failure("getBalance"))).toEqual({
      tier: "sync",
      sampleRate: 0.05,
      inSample: false,
    });
    expect(transmit(failure("broadcast"))).toEqual({
      tier: "transaction",
      sampleRate: 1,
      inSample: true,
    });
  });

  it("returns null for a dropped call", () => {
    const transmit = createCoinModuleCallTransmitter(() => config, { random: () => 0.5 });
    expect(transmit(event("getBalance", "success"))).toBeNull();
  });

  it.each(["craftTransaction", "craftRawTransaction", "combine", "broadcast"])(
    "always sends a transaction-tier call (%s)",
    method => {
      const transmit = createCoinModuleCallTransmitter(() => config, { random: never });
      expect(transmit(event(method, "success"))).toEqual({
        tier: "transaction",
        sampleRate: 1,
        inSample: true,
      });
    },
  );

  it("samples craftTransactionData at the preparation rate", () => {
    const transmit = createCoinModuleCallTransmitter(() => config, { random: () => 0.05 });
    expect(transmit(event("craftTransactionData", "success"))).toEqual({
      tier: "preparation",
      sampleRate: 0.1,
      inSample: true,
    });
  });

  it("follows the flag's methodTiers over the defaults", () => {
    const transmit = createCoinModuleCallTransmitter(
      () => ({ ...config, methodTiers: { getBalance: "transaction" } }),
      { random: never },
    );
    expect(transmit(event("getBalance", "success"))).toEqual({
      tier: "transaction",
      sampleRate: 1,
      inSample: true,
    });
  });

  it("drops a method the defaults do not list, failures included", () => {
    const transmit = createCoinModuleCallTransmitter(() => config, { random: always });
    expect(transmit(event("someFutureMethod", "success"))).toBeNull();
    expect(transmit(event("someFutureMethod", "failure"))).toBeNull();
  });

  it("sends an unlisted method the flag gives a tier", () => {
    const transmit = createCoinModuleCallTransmitter(
      () => ({ ...config, methodTiers: { someFutureMethod: "sync" } }),
      { random: always },
    );
    expect(transmit(event("someFutureMethod", "success"))).toEqual({
      tier: "sync",
      sampleRate: 0.05,
      inSample: true,
    });
  });

  it("samples not-supported calls like successes", () => {
    const transmit = createCoinModuleCallTransmitter(() => config, { random: never });
    expect(transmit(event("getStakes", "not_supported"))).toBeNull();
  });
});

describe("createCoinModuleCallTransmitter", () => {
  const config = {
    includeSyncPath: true,
    syncPathSampleRate: 0.1,
    preparationSampleRate: 0.1,
    maxFailuresPerKey: 2,
  };

  it("transmits nothing when the config reader returns null", () => {
    const transmit = transmitter(() => null);
    expect(transmit(failure())).toBe(false);
    expect(transmit({ ...failure("broadcast"), status: "success" })).toBe(false);
  });

  it("caps failures per method, currency and error name", () => {
    const transmit = transmitter(() => config, { clock: () => 0 });
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
    const transmit = transmitter(() => config, { clock: () => at });
    transmit(failure());
    transmit(failure());
    expect(transmit(failure())).toBe(false);
    at = 60 * 60 * 1000;
    expect(transmit(failure())).toBe(true);
  });

  it("sends no failure when the cap is zero", () => {
    const transmit = transmitter(() => ({ ...config, maxFailuresPerKey: 0 }));
    expect(transmit(failure())).toBe(false);
  });

  it("applies the configured sample rate to sync-path successes", () => {
    const transmit = transmitter(() => ({ ...config, syncPathSampleRate: 0.5 }), {
      random: () => 0.4,
    });
    expect(transmit({ ...failure(), status: "success" })).toBe(true);
  });

  it("draws once per session, so a session sends all of its sync-path successes or none", () => {
    const random = jest.fn().mockReturnValueOnce(0.4).mockReturnValue(0.99);
    const transmit = transmitter(() => ({ ...config, syncPathSampleRate: 0.5 }), { random });
    const success = { ...failure(), status: "success" as const };

    expect([transmit(success), transmit(success), transmit(success)]).toEqual([true, true, true]);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it("compares the session draw with the rate read on every event", () => {
    let syncPathSampleRate = 0.5;
    const transmit = transmitter(() => ({ ...config, syncPathSampleRate }), {
      random: () => 0.4,
    });
    const success = { ...failure(), status: "success" as const };

    expect(transmit(success)).toBe(true);
    syncPathSampleRate = 0.3;
    expect(transmit(success)).toBe(false);
  });

  it("sends nothing for sync-path methods, failures included, when the sync path is excluded", () => {
    const transmit = transmitter(
      () => ({ ...config, includeSyncPath: false, syncPathSampleRate: 1 }),
      { random: () => 0 },
    );
    expect(transmit(failure("getBalance"))).toBe(false);
    expect(transmit({ ...failure("listOperations"), status: "success" })).toBe(false);
  });

  it("keeps transaction and preparation calls, failures included, when the sync path is excluded", () => {
    const transmit = transmitter(
      () => ({ ...config, includeSyncPath: false, preparationSampleRate: 1 }),
      { random: () => 0, clock: () => 0 },
    );
    expect(transmit({ ...failure("broadcast"), status: "success" })).toBe(true);
    expect(transmit({ ...failure("validateIntent"), status: "success" })).toBe(true);
    expect(transmit(failure("estimateFees"))).toBe(true);
  });

  it("still sends preparation failures at a zero preparation rate", () => {
    const transmit = transmitter(() => ({ ...config, preparationSampleRate: 0 }), {
      random: () => 0,
      clock: () => 0,
    });
    expect(transmit({ ...failure("estimateFees"), status: "success" })).toBe(false);
    expect(transmit(failure("estimateFees"))).toBe(true);
  });

  it("compares one session draw with each tier's rate", () => {
    const random = jest.fn(() => 0.2);
    const transmit = transmitter(
      () => ({ ...config, syncPathSampleRate: 0.5, preparationSampleRate: 0.1 }),
      { random },
    );
    expect(transmit({ ...failure("getBalance"), status: "success" })).toBe(true);
    expect(transmit({ ...failure("estimateFees"), status: "success" })).toBe(false);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it("still sends sync-path failures at a zero sample rate, unlike excluding the sync path", () => {
    const transmit = transmitter(() => ({ ...config, syncPathSampleRate: 0 }), {
      random: () => 0,
    });
    expect(transmit({ ...failure("getBalance"), status: "success" })).toBe(false);
    expect(transmit(failure("getBalance"))).toBe(true);
  });

  it("sends nothing of an off method, failures included", () => {
    const transmit = transmitter(
      () => ({ ...config, methodTiers: { craftTransactionData: "off" } }),
      { random: () => 0, clock: () => 0 },
    );
    expect(transmit({ ...failure("craftTransactionData"), status: "success" })).toBe(false);
    expect(transmit(failure("craftTransactionData"))).toBe(false);
  });

  it("applies a reclassification by the flag at once", () => {
    let methodTiers: Record<string, "transaction" | "preparation"> = {};
    const transmit = transmitter(() => ({ ...config, preparationSampleRate: 0.1, methodTiers }), {
      random: () => 0.5,
    });
    const success = { ...failure("craftTransactionData"), status: "success" as const };

    expect(transmit(success)).toBe(false);
    methodTiers = { craftTransactionData: "transaction" };
    expect(transmit(success)).toBe(true);
  });

  it("drops a method moved to the sync tier when the sync path is excluded", () => {
    const transmit = transmitter(
      () => ({ ...config, includeSyncPath: false, methodTiers: { broadcast: "sync" } }),
      { random: () => 0, clock: () => 0 },
    );
    expect(transmit(failure("broadcast"))).toBe(false);
  });

  it("reads the config on every event, so a flag change applies at once", () => {
    let current: typeof config | null = config;
    const transmit = transmitter(() => current);
    expect(transmit({ ...failure("broadcast"), status: "success" })).toBe(true);
    current = null;
    expect(transmit({ ...failure("broadcast"), status: "success" })).toBe(false);
  });
});

describe("default randomness and clock", () => {
  const config = {
    includeSyncPath: true,
    syncPathSampleRate: 0.1,
    preparationSampleRate: 0.1,
    maxFailuresPerKey: 1,
  };

  afterEach(() => jest.restoreAllMocks());

  // A sink builds its transmitter at module load, before any test stubs the globals.
  it("draws Math.random on first use, so a stub set after construction is honoured", () => {
    const transmit = transmitter(() => config);
    jest.spyOn(Math, "random").mockReturnValue(0);

    expect(transmit(call("success"))).toBe(true);
  });

  it("reads Date.now at call time, so a later stub is honoured", () => {
    const transmit = transmitter(() => config);
    const now = jest.spyOn(Date, "now").mockReturnValue(0);

    expect(transmit(call("failure"))).toBe(true);
    expect(transmit(call("failure"))).toBe(false);
    now.mockReturnValue(60 * 60 * 1000);
    expect(transmit(call("failure"))).toBe(true);
  });
});
