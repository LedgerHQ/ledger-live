import { renderHook, act } from "@tests/test-renderer";
import useFetchWithTimeout from "../useFetchWithTimeout";

describe("useFetchWithTimeout", () => {
  it("should resolve the fetch function result within the timeout", async () => {
    const fetchFunction = jest.fn().mockResolvedValue("data");
    const { result } = renderHook(() => useFetchWithTimeout(300));

    await act(async () => {
      const data = await result.current(fetchFunction);
      expect(data).toBe("data");
    });

    expect(fetchFunction).toHaveBeenCalledTimes(1);
  });

  it("should reject if the fetch function takes longer than the timeout", async () => {
    jest.useFakeTimers();
    const fetchFunction = jest
      .fn()
      .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve("data"), 600)));
    const { result } = renderHook(() => useFetchWithTimeout(300));

    act(() => {
      const fetchPromise = result.current(fetchFunction);
      jest.advanceTimersByTime(400);
      return expect(fetchPromise).rejects.toThrow("Fetch timed out");
    });

    jest.runAllTimers();
    expect(fetchFunction).toHaveBeenCalledTimes(1);
  });

  it("should reject if the fetch function throws an error", async () => {
    const fetchFunction = jest.fn().mockRejectedValue(new Error("Fetch error"));
    const { result } = renderHook(() => useFetchWithTimeout(300));

    await act(async () => {
      await expect(result.current(fetchFunction)).rejects.toThrow("Fetch error");
    });

    expect(fetchFunction).toHaveBeenCalledTimes(1);
  });
});
