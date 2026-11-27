import { createScrollCompactionStore } from "./createScrollCompactionStore";

describe("createScrollCompactionStore", () => {
  it("should be expanded by default", () => {
    const store = createScrollCompactionStore();

    expect(store.getIsCompact()).toBe(false);
  });

  it("should notify subscribers and mirror the state when it compacts", () => {
    const onApply = jest.fn();
    const store = createScrollCompactionStore({ onApply });
    const listener = jest.fn();
    store.subscribe(listener);

    store.setCompact(true);

    expect(store.getIsCompact()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenLastCalledWith(true);
  });

  it("should not notify subscribers when the state does not change", () => {
    const store = createScrollCompactionStore();
    const listener = jest.fn();
    store.subscribe(listener);

    store.setCompact(false);

    expect(listener).not.toHaveBeenCalled();
  });

  it("should stop notifying a listener once unsubscribed", () => {
    const store = createScrollCompactionStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setCompact(true);

    expect(listener).not.toHaveBeenCalled();
  });

  it("should expand, mirror it and move to a new reset generation on reset", () => {
    const onReset = jest.fn();
    const onApply = jest.fn();
    const store = createScrollCompactionStore({ onReset, onApply });
    store.setCompact(true);

    store.reset();

    expect(store.getIsCompact()).toBe(false);
    expect(store.getResetGeneration()).toBe(1);
    expect(onReset).toHaveBeenCalledWith(1);
    expect(onApply).toHaveBeenLastCalledWith(false);
  });

  it("should mirror the expanded state on reset even when the store is already expanded", () => {
    const onApply = jest.fn();
    const store = createScrollCompactionStore({ onApply });

    store.reset();

    expect(onApply).toHaveBeenCalledWith(false);
  });

  it("should record an acknowledged state without writing it back to the mirror", () => {
    const onApply = jest.fn();
    const store = createScrollCompactionStore({ onApply });
    const listener = jest.fn();
    store.subscribe(listener);

    store.acknowledgeCompact(true, store.getResetGeneration());

    expect(store.getIsCompact()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("should drop an acknowledgement computed before the last reset", () => {
    const onApply = jest.fn();
    const store = createScrollCompactionStore({ onApply });
    const staleGeneration = store.getResetGeneration();
    store.reset();
    onApply.mockClear();

    store.acknowledgeCompact(true, staleGeneration);

    expect(store.getIsCompact()).toBe(false);
    expect(onApply).not.toHaveBeenCalled();
  });
});
