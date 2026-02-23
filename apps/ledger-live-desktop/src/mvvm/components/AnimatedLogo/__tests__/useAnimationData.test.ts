import { renderHook } from "tests/testSetup";
import { useAnimationData } from "../useAnimationData";

jest.mock("../dark/collapse.json", () => ({ dark: "collapse" }));
jest.mock("../dark/expand.json", () => ({ dark: "expand" }));
jest.mock("../light/collapse.json", () => ({ light: "collapse" }));
jest.mock("../light/expand.json", () => ({ light: "expand" }));

describe("useAnimationData", () => {
  it("should return dark animations when theme is dark", () => {
    const { result } = renderHook(() => useAnimationData(), {
      initialState: { settings: { theme: "dark" } },
    });

    expect(result.current).toEqual({
      collapse: { dark: "collapse" },
      expand: { dark: "expand" },
      themeKey: "dark",
    });
  });

  it("should return light animations when theme is light", () => {
    const { result } = renderHook(() => useAnimationData(), {
      initialState: { settings: { theme: "light" } },
    });

    expect(result.current).toEqual({
      collapse: { light: "collapse" },
      expand: { light: "expand" },
      themeKey: "light",
    });
  });

  it("should default to dark when theme is not set", () => {
    const { result } = renderHook(() => useAnimationData(), {
      initialState: { settings: { theme: null } },
    });

    // userThemeSelector falls back to "dark" when theme is null (system mode)
    expect(result.current.themeKey).toBe("dark");
  });
});
