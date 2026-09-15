import type { LayoutChangeEvent } from "react-native";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { act, renderHook } from "@testing-library/react-native";
import { interpolate, useReducedMotion } from "react-native-reanimated";
import { getContentTranslateRatio, useSlideScrollAnimations } from "../useSlideScrollAnimations";

jest.mock("@ledgerhq/native-ui", () => ({
  useSlidesContext: jest.fn(),
}));

jest.mock("react-native-reanimated", () => ({
  Extrapolation: { CLAMP: "clamp" },
  interpolate: jest.fn(() => 0.5),
  useAnimatedStyle: (factory: () => unknown) => factory(),
  useReducedMotion: jest.fn(),
}));

const mockUseSlidesContext = jest.mocked(useSlidesContext);
const mockUseReducedMotion = jest.mocked(useReducedMotion);
const mockInterpolate = jest.mocked(interpolate);

describe("useSlideScrollAnimations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSlidesContext.mockReturnValue({
      scrollProgressSharedValue: { value: 1 },
    } as ReturnType<typeof useSlidesContext>);
    mockUseReducedMotion.mockReturnValue(false);
  });

  it("should use the platform-specific content translation ratio", () => {
    const ratios = { android: 0.05, ios: 0.2 };

    expect(getContentTranslateRatio("android", ratios)).toBe(0.05);
    expect(getContentTranslateRatio("ios", ratios)).toBe(0.2);
  });

  it("should calculate content and text animations after layout", () => {
    const { result } = renderHook(() => useSlideScrollAnimations(1));

    act(() => {
      result.current.handleLayout({
        nativeEvent: { layout: { width: 100 } },
      } as LayoutChangeEvent);
    });

    expect(result.current.animatedStyle).toEqual({
      opacity: 0.5,
      transform: [{ translateX: 0.5 }, { scale: 0.5 }],
    });
    expect(result.current.textAnimatedStyle).toEqual({
      opacity: 0.5,
      transform: [{ translateX: 0.5 }],
    });
    expect(mockInterpolate).toHaveBeenCalledWith(1, [0.4, 1, 1.6], [0, 1, 0], "clamp");
  });

  it("should disable animations when reduced motion is enabled", () => {
    mockUseReducedMotion.mockReturnValue(true);

    const { result } = renderHook(() => useSlideScrollAnimations(1));

    expect(result.current.animatedStyle).toEqual({});
    expect(result.current.textAnimatedStyle).toEqual({});
    expect(mockInterpolate).not.toHaveBeenCalled();
  });
});
