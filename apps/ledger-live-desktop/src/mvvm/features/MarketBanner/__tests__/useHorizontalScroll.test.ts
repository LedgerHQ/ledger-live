import { renderHook, act } from "tests/testSetup";
import { useHorizontalScroll } from "../hooks/useHorizontalScroll";

describe("useHorizontalScroll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return isAtStart true and isAtEnd false by default", () => {
    const { result } = renderHook(() => useHorizontalScroll());

    expect(result.current.isAtStart).toBe(true);
    expect(result.current.isAtEnd).toBe(false);
  });

  it("should expose a scrollContainerRef", () => {
    const { result } = renderHook(() => useHorizontalScroll());

    expect(result.current.scrollContainerRef).toBeDefined();
    expect(result.current.scrollContainerRef.current).toBeNull();
  });

  it("should call scrollBy with negative offset when scrollLeft is called", () => {
    const mockScrollBy = jest.fn();
    const { result } = renderHook(() => useHorizontalScroll());

    Object.defineProperty(result.current.scrollContainerRef, "current", {
      value: { scrollBy: mockScrollBy },
      writable: true,
    });

    act(() => result.current.scrollLeft());

    expect(mockScrollBy).toHaveBeenCalledWith({ left: -300, behavior: "smooth" });
  });

  it("should call scrollBy with positive offset when scrollRight is called", () => {
    const mockScrollBy = jest.fn();
    const { result } = renderHook(() => useHorizontalScroll());

    Object.defineProperty(result.current.scrollContainerRef, "current", {
      value: { scrollBy: mockScrollBy },
      writable: true,
    });

    act(() => result.current.scrollRight());

    expect(mockScrollBy).toHaveBeenCalledWith({ left: 300, behavior: "smooth" });
  });
});
