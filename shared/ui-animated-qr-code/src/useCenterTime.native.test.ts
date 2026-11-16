import { renderHook } from "@testing-library/react-native";
import { runningAnimation } from "../jest/mocks/react-native-reanimated";
import { CENTER_POP, SHIMMER_SWEEP } from "./animationTimeline";
import { useCenterTime } from "./useCenterTime";
import type { QrAnimation } from "./types";

type Props = { animation: QrAnimation; animated: boolean; pressCount: number };

function renderCenterTime(initialProps: Props) {
  return renderHook(
    ({ animation, animated, pressCount }: Props) => useCenterTime(animation, animated, pressCount),
    { initialProps },
  );
}

const SHIMMER_LOOP = {
  type: "repeat",
  count: -1,
  animation: { type: "timing", toValue: SHIMMER_SWEEP, duration: SHIMMER_SWEEP * 1000 },
};
const POP = { type: "timing", toValue: CENTER_POP, duration: CENTER_POP * 1000 };

describe("useCenterTime", () => {
  it("rests at the end of the pop, with nothing running", () => {
    const { result } = renderCenterTime({ animation: "ripple", animated: true, pressCount: 0 });

    expect(result.current.get()).toBe(CENTER_POP);
    expect(runningAnimation(result.current)).toBeNull();
  });

  it("loops the shimmer from 0 while loading", () => {
    const { result } = renderCenterTime({ animation: "loading", animated: true, pressCount: 0 });

    expect(result.current.get()).toBe(0);
    expect(runningAnimation(result.current)).toEqual(SHIMMER_LOOP);
  });

  it("stops the shimmer once loaded", () => {
    const { result, rerender } = renderCenterTime({
      animation: "loading",
      animated: true,
      pressCount: 0,
    });

    rerender({ animation: "ripple", animated: true, pressCount: 0 });

    expect(result.current.get()).toBe(CENTER_POP);
    expect(runningAnimation(result.current)).toBeNull();
  });

  it("holds the skeleton still with motion off", () => {
    const { result } = renderCenterTime({ animation: "loading", animated: false, pressCount: 0 });

    expect(result.current.get()).toBe(0);
    expect(runningAnimation(result.current)).toBeNull();
  });

  it("plays the pop from 0 on each press", () => {
    const { result, rerender } = renderCenterTime({
      animation: "ripple",
      animated: true,
      pressCount: 0,
    });

    rerender({ animation: "ripple", animated: true, pressCount: 1 });

    expect(result.current.get()).toBe(0);
    expect(runningAnimation(result.current)).toEqual(POP);
  });
});
