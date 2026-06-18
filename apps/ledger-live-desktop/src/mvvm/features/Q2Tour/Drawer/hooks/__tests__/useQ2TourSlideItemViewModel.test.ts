import { renderHook } from "tests/testSetup";
import { SLIDE_IMAGES } from "../../assets";
import { useQ2TourSlideItemViewModel } from "../useQ2TourSlideItemViewModel";

describe("useQ2TourSlideItemViewModel", () => {
  it("should return welcome slide copy for index 0", () => {
    const { result } = renderHook(() => useQ2TourSlideItemViewModel({ slideIndex: 0 }), {
      initialState: { settings: { theme: "light" } },
    });

    expect(result.current).toEqual({
      title: "Smarter portfolio management. Clearer paths to growth",
      description: "",
      imageSrc: SLIDE_IMAGES.light[0],
    });
  });

  it("should return slide copy for a valid index", () => {
    const { result } = renderHook(() => useQ2TourSlideItemViewModel({ slideIndex: 1 }), {
      initialState: { settings: { theme: "light" } },
    });

    expect(result.current).toEqual({
      title: "One balance for each asset",
      description:
        "Multi-chain assets like USDT are now shown as one total. Simple, accurate, clear.",
      imageSrc: SLIDE_IMAGES.light[1],
    });
  });

  it("should fall back to the first slide when index is out of range", () => {
    const { result } = renderHook(() => useQ2TourSlideItemViewModel({ slideIndex: 99 }), {
      initialState: { settings: { theme: "light" } },
    });

    expect(result.current).toEqual({
      title: "Smarter portfolio management. Clearer paths to growth",
      description: "",
      imageSrc: SLIDE_IMAGES.light[0],
    });
  });

  it.each([
    ["light", "light"],
    ["dark", "dark"],
  ] as const)("should use %s theme images when theme is %s", (theme, expectedTheme) => {
    const { result } = renderHook(() => useQ2TourSlideItemViewModel({ slideIndex: 2 }), {
      initialState: { settings: { theme } },
    });

    expect(result.current.imageSrc).toBe(SLIDE_IMAGES[expectedTheme][2]);
    expect(result.current.title).toBe("Your returns, front and center");
  });
});
