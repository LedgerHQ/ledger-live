import { act, renderHook } from "@testing-library/react-native";
import { useFinishingProgress, type ProgressDisplay } from ".";

const updating = (progress: number): ProgressDisplay => ({
  progress,
  isRestoring: false,
  update: { index: 2, count: 3 },
});

type Props = { display: ProgressDisplay | undefined; isDone: boolean };

const renderFinishing = (initialProps: Props) =>
  renderHook((props: Props) => useFinishingProgress(props).finishing, { initialProps });

describe("useFinishingProgress", () => {
  it("has nothing to finish while the step is not done", () => {
    const { result } = renderFinishing({ display: updating(0.5), isDone: false });

    expect(result.current).toBeUndefined();
  });

  it("exposes the last progress shown to fill it up once the step is done", () => {
    const { result, rerender } = renderFinishing({ display: updating(0.4), isDone: false });

    rerender({ display: updating(0.9), isDone: false });
    rerender({ display: undefined, isDone: true });

    expect(result.current).toMatchObject({ from: 0.9, display: updating(0.9) });
  });

  it("keeps the last progress across the states that carry none", () => {
    const { result, rerender } = renderFinishing({ display: updating(0.7), isDone: false });

    rerender({ display: undefined, isDone: false });
    rerender({ display: undefined, isDone: true });

    expect(result.current?.from).toBe(0.7);
  });

  it("has nothing to fill when the bar was already full", () => {
    const { result, rerender } = renderFinishing({ display: updating(1), isDone: false });

    rerender({ display: undefined, isDone: true });

    expect(result.current).toBeUndefined();
  });

  it("has nothing to fill when no progress was ever shown", () => {
    const { result } = renderFinishing({ display: undefined, isDone: true });

    expect(result.current).toBeUndefined();
  });

  it("stops finishing once the bar reports it is full", () => {
    const { result, rerender } = renderFinishing({ display: updating(0.9), isDone: false });
    rerender({ display: undefined, isDone: true });

    act(() => result.current?.onFinished());

    expect(result.current).toBeUndefined();
  });

  it("ignores the end of a regular progress animation", () => {
    const { result, rerender } = renderFinishing({ display: updating(0.9), isDone: false });
    const staleOnFinished = result.current?.onFinished;
    rerender({ display: undefined, isDone: true });

    act(() => staleOnFinished?.());

    expect(result.current).toMatchObject({ from: 0.9 });
  });
});

describe("useFinishingProgress lastDisplay", () => {
  it("is undefined until a progress is shown, then keeps the last one", () => {
    const { result, rerender } = renderHook((props: Props) => useFinishingProgress(props), {
      initialProps: { display: undefined, isDone: false } as Props,
    });
    expect(result.current.lastDisplay).toBeUndefined();

    rerender({ display: updating(0.4), isDone: false });
    rerender({ display: undefined, isDone: false });

    expect(result.current.lastDisplay).toEqual(updating(0.4));
  });
});
