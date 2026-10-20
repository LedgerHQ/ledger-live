import {
  emitCoinModuleCall,
  hasCoinModuleCallObservers,
  resetCoinModuleCallObservers,
  setCoinModuleCallObserver,
  type CoinModuleCallEvent,
} from "./coinModuleCall";

const event: CoinModuleCallEvent = {
  method: "lastBlock",
  network: "ripple",
  family: "xrp",
  durationMs: 3,
  status: "success",
};

describe("coin-module call registry", () => {
  afterEach(() => resetCoinModuleCallObservers());

  it("reports whether anyone listens", () => {
    expect(hasCoinModuleCallObservers()).toBe(false);
    setCoinModuleCallObserver(() => {});
    expect(hasCoinModuleCallObservers()).toBe(true);
  });

  it("delivers an event to every observer", () => {
    const first = jest.fn();
    const second = jest.fn();
    setCoinModuleCallObserver(first);
    setCoinModuleCallObserver(second);

    emitCoinModuleCall(event);

    expect(first).toHaveBeenCalledWith(event);
    expect(second).toHaveBeenCalledWith(event);
  });

  it("keeps delivering when an observer throws", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const after = jest.fn();
    setCoinModuleCallObserver(() => {
      throw new Error("sink down");
    });
    setCoinModuleCallObserver(after);

    expect(() => emitCoinModuleCall(event)).not.toThrow();

    expect(after).toHaveBeenCalledWith(event);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("stops delivering to an observer once unsubscribed", () => {
    const observer = jest.fn();
    const unsubscribe = setCoinModuleCallObserver(observer);

    unsubscribe();
    unsubscribe();
    emitCoinModuleCall(event);

    expect(observer).not.toHaveBeenCalled();
    expect(hasCoinModuleCallObservers()).toBe(false);
  });
});
