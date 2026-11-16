import { act, renderHook } from "@testing-library/react-native";
import { runFrame } from "../jest/mocks/react-native-reanimated";
import { NEVER_PRESSED } from "./animationTimeline";
import { useQrClock } from "./useQrClock";

function renderClock(triggerKey = 0, animated = true) {
  return renderHook(
    ({ key, motion }: { key: number; motion: boolean }) => useQrClock(key, motion),
    { initialProps: { key: triggerKey, motion: animated } },
  );
}

describe("useQrClock", () => {
  it("counts seconds from the first frame", () => {
    const { result } = renderClock();

    runFrame(5000);
    runFrame(6500);

    expect(result.current.time.get()).toBe(1.5);
  });

  it("stays at 0 with motion off", () => {
    const { result } = renderClock(0, false);

    runFrame(5000);
    runFrame(6500);

    expect(result.current.time.get()).toBe(0);
  });

  it("stops and resets when motion turns off", () => {
    const { result, rerender } = renderClock();
    runFrame(1000);
    runFrame(2000);
    act(() => result.current.press());

    rerender({ key: 0, motion: false });
    runFrame(3000);

    expect(result.current.time.get()).toBe(0);
    expect(result.current.pressedAt.get()).toBe(NEVER_PRESSED);
  });

  it("stores a press at the current time", () => {
    const { result } = renderClock();
    runFrame(1000);
    runFrame(3000);

    act(() => result.current.press());

    expect(result.current.pressedAt.get()).toBe(2);
  });

  it("ignores presses with motion off", () => {
    const { result } = renderClock(0, false);

    act(() => result.current.press());

    expect(result.current.pressedAt.get()).toBe(NEVER_PRESSED);
  });

  it("plays a press for each new trigger key, not for the first one", () => {
    const { result, rerender } = renderClock(4);
    runFrame(1000);
    runFrame(2000);

    expect(result.current.pressedAt.get()).toBe(NEVER_PRESSED);
    expect(result.current.pressCount).toBe(0);

    rerender({ key: 5, motion: true });

    expect(result.current.pressedAt.get()).toBe(1);
    expect(result.current.pressCount).toBe(1);

    rerender({ key: 5, motion: true });
    rerender({ key: 6, motion: true });

    expect(result.current.pressCount).toBe(2);
  });

  it("drops a trigger received with motion off, even once motion is back", () => {
    const { result, rerender } = renderClock(0, false);

    rerender({ key: 1, motion: false });
    rerender({ key: 1, motion: true });

    expect(result.current.pressCount).toBe(0);
    expect(result.current.pressedAt.get()).toBe(NEVER_PRESSED);
  });

  it("keeps the clock running across re-renders", () => {
    const { result, rerender } = renderClock();
    runFrame(1000);
    runFrame(2000);

    rerender({ key: 0, motion: true });
    runFrame(3000);

    expect(result.current.time.get()).toBe(2);
  });
});
