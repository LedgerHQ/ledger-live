import { notSupported } from "@ledgerhq/coin-module-framework/api/index";
import {
  resetCoinModuleCallObservers,
  setCoinModuleCallObserver,
  type CoinModuleCallEvent,
} from "@features/platform-coin-observability";
import { withMetrics } from "./metrics";

const labels = { network: "ripple", family: "xrp" };

// A loose module: only the methods a test exercises, plus a framework stub for an omitted one.
const makeApi = (overrides: Record<string, unknown> = {}) =>
  ({
    lastBlock: jest.fn().mockResolvedValue({ height: 1 }),
    combine: jest.fn().mockReturnValue("signed"),
    getStakes: notSupported("getStakes"),
    ...overrides,
  }) as any;

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
