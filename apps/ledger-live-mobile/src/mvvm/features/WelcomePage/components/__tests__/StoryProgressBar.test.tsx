import React from "react";
import { render } from "@tests/test-renderer";
import { ReduceMotion } from "react-native-reanimated";
import { StoryProgressBar } from "../StoryProgressBar";

const mockWithTiming = jest.fn((value: unknown, _config?: unknown) => value);

type SharedValueMock = { value: number; writes: number[] };
const sharedValues: SharedValueMock[] = [];

jest.mock("react-native-reanimated", () => {
  const actualReanimated = jest.requireActual("react-native-reanimated");
  const ReactActual = jest.requireActual<typeof import("react")>("react");

  return {
    ...actualReanimated,
    __esModule: true,
    // Keeps the value across renders, and records every write so tests can tell an empty
    // bar being filled apart from a bar that was full all along.
    useSharedValue: (initial: number) => {
      const sharedValueRef = ReactActual.useRef<SharedValueMock | null>(null);

      if (!sharedValueRef.current) {
        const writes = [initial];
        sharedValueRef.current = {
          get value() {
            return writes[writes.length - 1];
          },
          set value(newValue: number) {
            writes.push(newValue);
          },
          writes,
        };
        sharedValues.push(sharedValueRef.current);
      }

      return sharedValueRef.current;
    },
    useAnimatedStyle: () => ({}),
    withTiming: (value: unknown, config?: unknown) => mockWithTiming(value, config),
  };
});

describe("StoryProgressBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sharedValues.length = 0;
  });

  it("should not fill the bar while the story duration is unknown", () => {
    render(<StoryProgressBar durationMs={0} isActivated />);

    expect(mockWithTiming).not.toHaveBeenCalled();
    expect(sharedValues[0].value).toBe(0);
  });

  it("should fill the bar over the story duration once it is known", () => {
    const { rerender } = render(<StoryProgressBar durationMs={0} isActivated />);

    rerender(<StoryProgressBar durationMs={4567} isActivated />);

    expect(mockWithTiming).toHaveBeenCalledTimes(1);
    expect(mockWithTiming).toHaveBeenCalledWith(100, expect.objectContaining({ duration: 4567 }));
  });

  it("should fill the bar over the story duration even when the system asks for less motion", () => {
    render(<StoryProgressBar durationMs={4567} isActivated />);

    expect(mockWithTiming).toHaveBeenCalledWith(
      100,
      expect.objectContaining({ reduceMotion: ReduceMotion.Never }),
    );
  });

  it("should keep a completed bar full instead of emptying it", () => {
    const { rerender } = render(<StoryProgressBar durationMs={4567} isActivated />);

    expect(sharedValues[0].value).toBe(100);

    rerender(<StoryProgressBar durationMs={4567} isCompleted />);

    expect(sharedValues[0].value).toBe(100);
  });

  it("should empty the bar of a story that is neither playing nor completed", () => {
    const { rerender } = render(<StoryProgressBar durationMs={4567} isCompleted />);

    rerender(<StoryProgressBar durationMs={4567} />);

    expect(sharedValues[0].value).toBe(0);
  });

  it("should empty the bar before replaying a completed story", () => {
    const { rerender } = render(<StoryProgressBar durationMs={4567} isCompleted />);

    expect(mockWithTiming).not.toHaveBeenCalled();
    expect(sharedValues[0].value).toBe(100);

    rerender(<StoryProgressBar durationMs={4567} isActivated />);

    expect(mockWithTiming).toHaveBeenCalledWith(100, expect.objectContaining({ duration: 4567 }));
    // The animation must start from an empty bar, otherwise the story plays behind a full one.
    expect(sharedValues[0].writes).toEqual([0, 100, 0, 100]);
  });

  it("should replay the bar when the active story is restarted", () => {
    const { rerender } = render(<StoryProgressBar durationMs={4567} isActivated restartKey={0} />);

    rerender(<StoryProgressBar durationMs={4567} isActivated restartKey={1} />);

    expect(mockWithTiming).toHaveBeenCalledTimes(2);
  });
});
