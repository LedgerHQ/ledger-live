import { renderHook } from "tests/testSetup";
import useTheme from "~/renderer/hooks/useTheme";
import { useThemedAwarenessModalImage } from "../useThemedAwarenessModalImage";

jest.mock("~/renderer/hooks/useTheme");

const mockUseTheme = jest.mocked(useTheme);

const themedUrls = {
  imageUrlLight: "https://example.com/light.png",
  imageUrlDark: "https://example.com/dark.png",
};

describe("useThemedAwarenessModalImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({ theme: "light" } as ReturnType<typeof useTheme>);
  });

  it("should return empty imageUrl and hide image when urls are undefined", () => {
    const { result } = renderHook(() => useThemedAwarenessModalImage(undefined));

    expect(result.current).toEqual({ imageUrl: "", showImage: false });
  });

  it.each([
    ["light", "https://example.com/light.png"],
    ["dark", "https://example.com/dark.png"],
  ] as const)("should return the %s image url when theme is %s", (theme, expectedUrl) => {
    mockUseTheme.mockReturnValue({ theme } as ReturnType<typeof useTheme>);
    const { result } = renderHook(() => useThemedAwarenessModalImage(themedUrls));

    expect(result.current).toEqual({ imageUrl: expectedUrl, showImage: true });
  });

  it("should fall back to light url on dark theme when dark url is empty", () => {
    mockUseTheme.mockReturnValue({ theme: "dark" } as ReturnType<typeof useTheme>);
    const urls = { imageUrlLight: "https://example.com/light.png", imageUrlDark: "" };

    const { result } = renderHook(() => useThemedAwarenessModalImage(urls));

    expect(result.current).toEqual({
      imageUrl: "https://example.com/light.png",
      showImage: true,
    });
  });

  it("should hide image when both themed urls are empty", () => {
    const urls = { imageUrlLight: "", imageUrlDark: "" };

    const { result } = renderHook(() => useThemedAwarenessModalImage(urls));

    expect(result.current).toEqual({ imageUrl: "", showImage: false });
  });

  it("should treat non-dark themes as light", () => {
    mockUseTheme.mockReturnValue({ theme: undefined } as unknown as ReturnType<typeof useTheme>);

    const { result } = renderHook(() => useThemedAwarenessModalImage(themedUrls));

    expect(result.current).toEqual({
      imageUrl: "https://example.com/light.png",
      showImage: true,
    });
  });
});
