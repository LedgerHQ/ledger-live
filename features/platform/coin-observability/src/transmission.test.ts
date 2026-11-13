import {
  createCoinModuleCallTransmitter,
  sampleRateFor,
  shouldTransmitCoinModuleCall,
} from "./transmission";
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

describe("shouldTransmitCoinModuleCall", () => {
  it("always transmits a failure, even on the sync path", () => {
    expect(shouldTransmitCoinModuleCall(event("getBalance", "failure"), { random: never })).toBe(
      true,
    );
  });

  it.each(["craftTransaction", "craftRawTransaction", "combine", "broadcast"])(
    "always transmits a transaction-tier call (%s)",
    method => {
      expect(shouldTransmitCoinModuleCall(event(method, "success"), { random: never })).toBe(true);
    },
  );

  it.each(["craftTransactionData", "estimateFees", "validateIntent"])(
    "samples a preparation call (%s) with its own rate",
    method => {
      const sampled = (random: () => number, preparationSampleRate: number) =>
        shouldTransmitCoinModuleCall(event(method, "success"), {
          syncPathSampleRate: 1,
          preparationSampleRate,
          random,
        });

      expect(sampled(() => 0.05, 0.1)).toBe(true);
      expect(sampled(() => 0.5, 0.1)).toBe(false);
      expect(sampled(always, 0)).toBe(false);
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

  it("transmits nothing of an off method, failures included", () => {
    const methodTiers = { getBalance: "off" } as const;
    expect(shouldTransmitCoinModuleCall(event("getBalance", "failure"), { methodTiers })).toBe(
      false,
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

describe("sampleRateFor", () => {
  const rates = { syncPathSampleRate: 0.05, preparationSampleRate: 0.1 };

  it("gives each tier its rate", () => {
    expect(sampleRateFor("broadcast", rates)).toBe(1);
    expect(sampleRateFor("craftTransactionData", rates)).toBe(0.1);
    expect(sampleRateFor("estimateFees", rates)).toBe(0.1);
    expect(sampleRateFor("getBalance", rates)).toBe(0.05);
  });

  it("follows the flag's methodTiers over the defaults", () => {
    const methodTiers = { craftTransactionData: "off", getBalance: "transaction" } as const;
    expect(sampleRateFor("craftTransactionData", { ...rates, methodTiers })).toBe(0);
    expect(sampleRateFor("getBalance", { ...rates, methodTiers })).toBe(1);
  });

  it("puts an unknown method in the sync tier", () => {
    expect(sampleRateFor("someFutureMethod", rates)).toBe(0.05);
  });
});

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
