import { act, renderHook } from "@testing-library/react-hooks";
import { useAPI } from "../useAPI";

describe("useAPI hook", () => {
  it("sets initial state correctly", async () => {
    const { result } = renderHook(() => useAPI(() => Promise.resolve(), false));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("calls execute immediately if immediate is true", async () => {
    const asyncFn = jest.fn().mockResolvedValue("data");

    renderHook(() => useAPI(asyncFn));

    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it("does not call execute immediately if immediate is false", async () => {
    const asyncFn = jest.fn().mockResolvedValue("data");

    renderHook(() => useAPI(asyncFn, false));

    expect(asyncFn).toHaveBeenCalledTimes(0);
  });

  it("sets isLoading while function is executing", async () => {
    let resolve: (value: string) => void = () => {};
    const asyncFn = jest.fn(
      () =>
        new Promise(r => {
          resolve = r;
        }),
    );

    const { result, waitForNextUpdate } = renderHook(() => useAPI(asyncFn));

    act(() => {
      result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve("data");
      await waitForNextUpdate();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("sets data when function resolves", async () => {
    const asyncFn = jest.fn().mockResolvedValue("data");

    const { result } = renderHook(() => useAPI(asyncFn));

    await act(async () => {
      result.current.execute();
    });

    expect(result.current.data).toBe("data");
  });

  it("sets error when function throws", async () => {
    const asyncFn = jest.fn().mockRejectedValue(new Error("error"));

    const { result } = renderHook(() => useAPI(asyncFn));

    await act(async () => {
      result.current.execute();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe("error");
  });
});
