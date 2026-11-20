import { act, renderHook } from "@testing-library/react";
import {
  createOperationTracker,
  type OperationSink,
  type OperationTracker,
} from "@shared/observability-operations";
import { createUseOperation } from "./useOperation";

const createSink = () => ({
  isRecording: () => true,
  start: jest.fn<void, Parameters<OperationSink["start"]>>(),
  succeed: jest.fn<void, Parameters<OperationSink["succeed"]>>(),
  fail: jest.fn<void, Parameters<OperationSink["fail"]>>(),
});

describe("useOperation", () => {
  let sink: ReturnType<typeof createSink>;
  let tracker: OperationTracker;
  let useOperation: ReturnType<typeof createUseOperation>;

  beforeEach(() => {
    sink = createSink();
    tracker = createOperationTracker();
    tracker.setSink(sink);
    useOperation = createUseOperation(tracker);
  });

  it("should keep the same handlers across renders", () => {
    const { result, rerender } = renderHook(() => useOperation("checkout"));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(result.current.start).toBe(first.start);
    expect(result.current.succeed).toBe(first.succeed);
    expect(result.current.fail).toBe(first.fail);
    expect(result.current.isActive).toBe(first.isActive);
  });

  it("should abandon the operation it started when unmounted", () => {
    const { result, unmount } = renderHook(() => useOperation("checkout"));
    act(() => {
      result.current.start({ attempt: 1 });
    });

    unmount();

    expect(sink.fail).toHaveBeenCalledWith("checkout", undefined, "ABANDONED", {
      attempt: 1,
      trigger: "unmount",
    });
    expect(tracker.isActive("checkout")).toBe(false);
  });

  it("should not abandon the operation when unmounted after a success", () => {
    const { result, unmount } = renderHook(() => useOperation("checkout"));
    act(() => {
      result.current.start();
      result.current.succeed({ items: 1 });
    });

    unmount();

    expect(sink.succeed).toHaveBeenCalledWith("checkout", undefined, { items: 1 });
    expect(sink.fail).not.toHaveBeenCalled();
  });

  it("should not abandon an operation another component started", () => {
    tracker.start("checkout");
    const { result, unmount } = renderHook(() => useOperation("checkout"));
    act(() => {
      expect(result.current.start()).toBe(false);
    });

    unmount();

    expect(sink.fail).not.toHaveBeenCalled();
    expect(tracker.isActive("checkout")).toBe(true);
  });

  it("should not abandon the operation on unmount when abandonOnUnmount is false", () => {
    const { result, unmount } = renderHook(() =>
      useOperation("checkout", { abandonOnUnmount: false }),
    );
    act(() => {
      result.current.start();
    });

    unmount();

    expect(sink.fail).not.toHaveBeenCalled();
    expect(tracker.isActive("checkout")).toBe(true);
  });

  it("should drive the operation of its operation key", () => {
    const { result } = renderHook(() => useOperation("checkout", { operationKey: "cart-1" }));
    act(() => {
      result.current.start();
    });

    expect(result.current.isActive()).toBe(true);
    expect(tracker.isActive("checkout", { operationKey: "cart-1" })).toBe(true);
    expect(tracker.isActive("checkout")).toBe(false);

    act(() => {
      result.current.fail("ERROR", { error_name: "NetworkDown" });
    });

    expect(sink.fail).toHaveBeenCalledWith("checkout", "cart-1", "ERROR", {
      error_name: "NetworkDown",
    });
    expect(result.current.isActive()).toBe(false);
  });

  it("should abandon its operation once when its key changes, then drive the new key", () => {
    const { result, rerender, unmount } = renderHook(
      ({ operationKey }) => useOperation("checkout", { operationKey }),
      { initialProps: { operationKey: "cart-1" } },
    );
    act(() => {
      result.current.start();
    });

    rerender({ operationKey: "cart-2" });

    expect(sink.fail).toHaveBeenCalledTimes(1);
    expect(sink.fail).toHaveBeenLastCalledWith("checkout", "cart-1", "ABANDONED", {
      trigger: "identity_change",
    });
    expect(tracker.isActive("checkout", { operationKey: "cart-1" })).toBe(false);

    act(() => {
      expect(result.current.start()).toBe(true);
    });
    expect(sink.start).toHaveBeenLastCalledWith("checkout", "cart-2", {});

    unmount();

    expect(sink.fail).toHaveBeenCalledTimes(2);
    expect(sink.fail).toHaveBeenLastCalledWith("checkout", "cart-2", "ABANDONED", {
      trigger: "unmount",
    });
  });

  it("should abandon its operation when its name changes", () => {
    const { result, rerender } = renderHook(({ name }) => useOperation(name), {
      initialProps: { name: "checkout" },
    });
    act(() => {
      result.current.start();
    });

    rerender({ name: "payment" });

    expect(sink.fail).toHaveBeenCalledWith("checkout", undefined, "ABANDONED", {
      trigger: "identity_change",
    });
    expect(result.current.isActive()).toBe(false);
  });

  it("should keep its operation on a rerender with the same identity", () => {
    const { result, rerender } = renderHook(
      ({ operationKey }) => useOperation("checkout", { operationKey }),
      { initialProps: { operationKey: "cart-1" } },
    );
    act(() => {
      result.current.start();
    });

    rerender({ operationKey: "cart-1" });

    expect(sink.fail).not.toHaveBeenCalled();
    expect(result.current.isActive()).toBe(true);
  });

  it("should send nothing when its identity changes after an outside stop", () => {
    const { result, rerender } = renderHook(
      ({ operationKey }) => useOperation("checkout", { operationKey }),
      { initialProps: { operationKey: "cart-1" } },
    );
    act(() => {
      result.current.start();
    });
    tracker.fail("checkout", "ABANDONED", { operationKey: "cart-1" });
    tracker.start("checkout", { operationKey: "cart-1" });
    sink.fail.mockClear();

    rerender({ operationKey: "cart-2" });

    expect(sink.fail).not.toHaveBeenCalled();
    expect(tracker.isActive("checkout", { operationKey: "cart-1" })).toBe(true);
    act(() => {
      expect(result.current.start()).toBe(true);
    });
  });

  it("should keep its active operation when started again with the same identity", () => {
    const { result } = renderHook(() => useOperation("checkout", { operationKey: "cart-1" }));
    act(() => {
      result.current.start();
    });

    act(() => {
      expect(result.current.start()).toBe(false);
    });

    expect(sink.start).toHaveBeenCalledTimes(1);
    expect(tracker.isActive("checkout", { operationKey: "cart-1" })).toBe(true);
  });

  it("should not abandon a newer operation of the same name started after an outside stop", () => {
    const { result, unmount } = renderHook(() => useOperation("checkout"));
    act(() => {
      result.current.start();
    });

    tracker.fail("checkout", "ABANDONED", { attributes: { trigger: "close" } });
    tracker.start("checkout", { attributes: { attempt: 1 } });
    sink.fail.mockClear();

    expect(result.current.isActive()).toBe(false);
    unmount();

    expect(sink.fail).not.toHaveBeenCalled();
    expect(tracker.isActive("checkout")).toBe(true);
  });

  it("should not stop a newer operation of the same name started after an outside stop", () => {
    const { result } = renderHook(() => useOperation("checkout"));
    act(() => {
      result.current.start();
    });
    tracker.fail("checkout", "ABANDONED");
    tracker.start("checkout");
    sink.fail.mockClear();

    act(() => {
      expect(result.current.succeed()).toBe(false);
    });

    expect(sink.succeed).not.toHaveBeenCalled();
    expect(sink.fail).not.toHaveBeenCalled();
    expect(tracker.isActive("checkout")).toBe(true);
  });

  it("should start nothing when the tracker does not record", () => {
    tracker.setSink(null);
    const { result, unmount } = renderHook(() => useOperation("checkout"));

    act(() => {
      expect(result.current.start()).toBe(false);
    });
    unmount();

    expect(result.current.isActive()).toBe(false);
    expect(sink.start).not.toHaveBeenCalled();
    expect(sink.fail).not.toHaveBeenCalled();
  });
});
