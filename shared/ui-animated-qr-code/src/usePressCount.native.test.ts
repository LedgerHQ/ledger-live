import { act, renderHook } from "@testing-library/react-native";
import { usePressCount } from "./usePressCount";

function renderPressCount(triggerKey = 0, enabled = true) {
  return renderHook(({ key, on }: { key: number; on: boolean }) => usePressCount(key, on), {
    initialProps: { key: triggerKey, on: enabled },
  });
}

describe("usePressCount", () => {
  it("counts each press", () => {
    const { result } = renderPressCount();

    act(() => result.current.press());
    act(() => result.current.press());

    expect(result.current.pressCount).toBe(2);
  });

  it("drops presses while off", () => {
    const { result } = renderPressCount(0, false);

    act(() => result.current.press());

    expect(result.current.pressCount).toBe(0);
  });

  it("counts each new trigger key, not the first one", () => {
    const { result, rerender } = renderPressCount(4);

    expect(result.current.pressCount).toBe(0);

    rerender({ key: 5, on: true });
    rerender({ key: 5, on: true });
    rerender({ key: 6, on: true });

    expect(result.current.pressCount).toBe(2);
  });

  it("drops a trigger received while off, even once presses are back on", () => {
    const { result, rerender } = renderPressCount(0, false);

    rerender({ key: 1, on: false });
    rerender({ key: 1, on: true });

    expect(result.current.pressCount).toBe(0);
  });
});
