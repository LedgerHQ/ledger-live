import { act, renderHook } from "@tests/test-renderer";
import { of, throwError } from "rxjs";
import { useObservable } from "../hooks/useObservable";

describe("useObservable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with subscribe and unsubscribe functions", () => {
    const { result } = renderHook(() => useObservable());

    expect(result.current.subscribe).toBeDefined();
    expect(result.current.unsubscribe).toBeDefined();
    expect(typeof result.current.subscribe).toBe("function");
    expect(typeof result.current.unsubscribe).toBe("function");
  });

  it("should subscribe to an observable and call onNext", () => {
    const { result } = renderHook(() => useObservable());
    const mockOnNext = jest.fn();
    const observable = of("test-value");

    act(() => {
      result.current.subscribe(observable, { onNext: mockOnNext });
    });

    expect(mockOnNext).toHaveBeenCalledWith("test-value");
  });

  it("should handle multiple values from observable", () => {
    const { result } = renderHook(() => useObservable());
    const mockOnNext = jest.fn();
    const observable = of("value1", "value2", "value3");

    act(() => {
      result.current.subscribe(observable, { onNext: mockOnNext });
    });

    expect(mockOnNext).toHaveBeenCalledTimes(3);
    expect(mockOnNext).toHaveBeenNthCalledWith(1, "value1");
    expect(mockOnNext).toHaveBeenNthCalledWith(2, "value2");
    expect(mockOnNext).toHaveBeenNthCalledWith(3, "value3");
  });

  it("should call onError when observable errors", () => {
    const { result } = renderHook(() => useObservable());
    const mockOnNext = jest.fn();
    const mockOnError = jest.fn();
    const testError = new Error("Test error");
    const observable = throwError(() => testError);

    act(() => {
      result.current.subscribe(observable, {
        onNext: mockOnNext,
        onError: mockOnError,
      });
    });

    expect(mockOnNext).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(testError);
  });

  it("should unsubscribe from previous subscription when subscribing to new observable", () => {
    const { result } = renderHook(() => useObservable());
    const mockOnNext1 = jest.fn();
    const mockOnNext2 = jest.fn();
    const observable1 = of("value1");
    const observable2 = of("value2");

    act(() => {
      result.current.subscribe(observable1, { onNext: mockOnNext1 });
      result.current.subscribe(observable2, { onNext: mockOnNext2 });
    });

    expect(mockOnNext1).toHaveBeenCalledWith("value1");
    expect(mockOnNext2).toHaveBeenCalledWith("value2");
  });

  it("should unsubscribe when unsubscribe is called", () => {
    const { result } = renderHook(() => useObservable());
    const mockOnNext = jest.fn();
    const observable = of("test-value");

    act(() => {
      result.current.subscribe(observable, { onNext: mockOnNext });
      result.current.unsubscribe();
    });

    expect(mockOnNext).toHaveBeenCalledWith("test-value");
  });

  it("should handle unsubscribe when no subscription exists", () => {
    const { result } = renderHook(() => useObservable());

    act(() => {
      result.current.unsubscribe();
    });

    expect(() => result.current.unsubscribe()).not.toThrow();
  });

  it("should clean up subscription on unmount", () => {
    const { result, unmount } = renderHook(() => useObservable());
    const mockOnNext = jest.fn();
    const observable = of("test-value");

    act(() => {
      result.current.subscribe(observable, { onNext: mockOnNext });
    });

    unmount();

    expect(mockOnNext).toHaveBeenCalledWith("test-value");
  });
});
