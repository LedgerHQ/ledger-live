import { createCoinModuleCallTransmitter, shouldTransmitCoinModuleCall } from "./transmission";
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
const never = () => 0.99;
const always = () => 0;

describe("shouldTransmitCoinModuleCall", () => {
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

describe("createCoinModuleCallTransmitter", () => {
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

  it("draws once per session, so a session sends all of its sync-path successes or none", () => {
    const random = jest.fn().mockReturnValueOnce(0.4).mockReturnValue(0.99);
    const transmit = createCoinModuleCallTransmitter(
      () => ({ ...config, syncPathSampleRate: 0.5 }),
      { random },
    );
    const success = { ...failure(), status: "success" as const };

    expect([transmit(success), transmit(success), transmit(success)]).toEqual([true, true, true]);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it("compares the session draw with the rate read on every event", () => {
    let syncPathSampleRate = 0.5;
    const transmit = createCoinModuleCallTransmitter(() => ({ ...config, syncPathSampleRate }), {
      random: () => 0.4,
    });
    const success = { ...failure(), status: "success" as const };

    expect(transmit(success)).toBe(true);
    syncPathSampleRate = 0.3;
    expect(transmit(success)).toBe(false);
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

describe("default randomness and clock", () => {
  const config = { includeSyncPath: true, syncPathSampleRate: 0.1, maxFailuresPerKey: 1 };

  afterEach(() => jest.restoreAllMocks());

  // A sink builds its transmitter at module load, before any test stubs the globals.
  it("draws Math.random on first use, so a stub set after construction is honoured", () => {
    const transmit = createCoinModuleCallTransmitter(() => config);
    jest.spyOn(Math, "random").mockReturnValue(0);

    expect(transmit(call("success"))).toBe(true);
  });

  it("reads Date.now at call time, so a later stub is honoured", () => {
    const transmit = createCoinModuleCallTransmitter(() => config);
    const now = jest.spyOn(Date, "now").mockReturnValue(0);

    expect(transmit(call("failure"))).toBe(true);
    expect(transmit(call("failure"))).toBe(false);
    now.mockReturnValue(60 * 60 * 1000);
    expect(transmit(call("failure"))).toBe(true);
  });
});
