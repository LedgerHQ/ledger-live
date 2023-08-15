import { act, renderHook } from "@testing-library/react-hooks";
import { useAPI } from "../useAPI";

describe("useAPI hook", () => {
  it("sets initial state correctly", async () => {
    const { result } = renderHook(() =>
      useAPI({ queryFn: () => Promise.resolve(), enabled: false }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("calls execute immediately if immediate is true", async () => {
    const queryFn = jest.fn().mockResolvedValue("data");

    renderHook(() => useAPI({ queryFn }));

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("does not call execute immediately if immediate is false", async () => {
    const queryFn = jest.fn().mockResolvedValue("data");

    renderHook(() => useAPI({ queryFn, enabled: false }));

    expect(queryFn).toHaveBeenCalledTimes(0);
  });

  it("sets isLoading while function is executing", async () => {
    let resolve: (value: string) => void = () => {};
    const queryFn = jest.fn(
      () =>
        new Promise(r => {
          resolve = r;
        }),
    );

    const { result, waitForNextUpdate } = renderHook(() => useAPI({ queryFn }));

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve("data");
      await waitForNextUpdate();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("sets data when function resolves", async () => {
    const queryFn = jest.fn().mockResolvedValue("data");

    const { result } = renderHook(() => useAPI({ queryFn }));

    await act(async () => {
      result.current.refetch();
    });

    expect(result.current.data).toBe("data");
  });

  it("sets error when function throws", async () => {
    const queryFn = jest.fn().mockRejectedValue(new Error("error"));

    const { result } = renderHook(() => useAPI({ queryFn }));

    await act(async () => {
      result.current.refetch();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe("error");
  });
});
