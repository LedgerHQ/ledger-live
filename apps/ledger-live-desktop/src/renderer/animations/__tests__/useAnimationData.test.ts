import { renderHook, waitFor } from "tests/testSetup";
import { useAnimationData, type AnimationLoader, type AnimationSource } from "..";

const loaderOf =
  (data: object): AnimationLoader =>
  () =>
    Promise.resolve({ default: data });

const renderWithSource = (initialSource: AnimationSource) =>
  renderHook(({ source }: { source: AnimationSource }) => useAnimationData(source), {
    initialProps: { source: initialSource },
  });

describe("useAnimationData", () => {
  it("returns parsed animation data as-is", () => {
    const data = { nm: "parsed" };
    const { result } = renderWithSource(data);
    expect(result.current).toBe(data);
  });

  it("resolves a loader to its default export", async () => {
    const data = { nm: "loaded" };
    const { result } = renderWithSource(loaderOf(data));
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBe(data));
  });

  it("returns nothing while a new loader is pending instead of the previous animation", async () => {
    const previous = { nm: "previous" };
    const { result, rerender } = renderWithSource(loaderOf(previous));
    await waitFor(() => expect(result.current).toBe(previous));

    rerender({ source: () => new Promise(() => {}) });

    expect(result.current).toBeUndefined();
  });

  it("returns nothing when a loader rejects instead of keeping the previous animation", async () => {
    const previous = { nm: "previous" };
    const rejecting = jest.fn<ReturnType<AnimationLoader>, []>(() =>
      Promise.reject(new Error("chunk load failed")),
    );
    const { result, rerender } = renderWithSource(loaderOf(previous));
    await waitFor(() => expect(result.current).toBe(previous));

    rerender({ source: rejecting });

    await waitFor(() => expect(rejecting).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });

  it("returns an already-loaded animation on the first render", async () => {
    const data = { nm: "cached" };
    const loader = loaderOf(data);
    const first = renderWithSource(loader);
    await waitFor(() => expect(first.result.current).toBe(data));

    const { result } = renderWithSource(loader);

    expect(result.current).toBe(data);
  });

  it("shows an animation that another consumer finished loading", async () => {
    const data = { nm: "shared" };
    let resolveFirstLoad: ((module: { default: unknown }) => void) | undefined;
    const firstLoad = new Promise<{ default: unknown }>(resolve => {
      resolveFirstLoad = resolve;
    });
    const loader = jest
      .fn<ReturnType<AnimationLoader>, []>(() => new Promise(() => {}))
      .mockImplementationOnce(() => firstLoad);
    const first = renderWithSource(loader);
    const { result } = renderWithSource(loader);

    resolveFirstLoad?.({ default: data });

    await waitFor(() => expect(first.result.current).toBe(data));
    expect(result.current).toBe(data);
  });
});
