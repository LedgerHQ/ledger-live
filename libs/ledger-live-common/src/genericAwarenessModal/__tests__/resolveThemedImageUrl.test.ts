import { hasThemedImage, resolveThemedImageUrl } from "../resolveThemedImageUrl";

describe("resolveThemedImageUrl", () => {
  const urls = {
    imageUrlLight: "https://example.com/light.png",
    imageUrlDark: "https://example.com/dark.png",
  };

  it.each([
    ["light", "https://example.com/light.png"],
    ["dark", "https://example.com/dark.png"],
  ] as const)("should return the %s image url", (theme, expectedUrl) => {
    expect(resolveThemedImageUrl(urls, theme)).toBe(expectedUrl);
  });

  it("should fall back to light when dark url is empty", () => {
    expect(
      resolveThemedImageUrl(
        { imageUrlLight: "https://example.com/light.png", imageUrlDark: "" },
        "dark",
      ),
    ).toBe("https://example.com/light.png");
  });

  it.each([
    ["light", "  https://example.com/light.png  ", "https://example.com/light.png"],
    ["dark", "  https://example.com/dark.png  ", "https://example.com/dark.png"],
  ] as const)("should trim whitespace from the %s image url", (theme, inputUrl, expectedUrl) => {
    const urls = {
      imageUrlLight: theme === "light" ? inputUrl : "https://example.com/light.png",
      imageUrlDark: theme === "dark" ? inputUrl : "https://example.com/dark.png",
    };

    expect(resolveThemedImageUrl(urls, theme)).toBe(expectedUrl);
  });

  it("should fall back to light when dark url is whitespace only", () => {
    expect(
      resolveThemedImageUrl(
        { imageUrlLight: "https://example.com/light.png", imageUrlDark: "   " },
        "dark",
      ),
    ).toBe("https://example.com/light.png");
  });

  it("should return an empty string when light url is whitespace only", () => {
    expect(resolveThemedImageUrl({ imageUrlLight: "  \t  ", imageUrlDark: "" }, "light")).toBe("");
  });
});

describe("hasThemedImage", () => {
  it.each([
    ["light", true],
    ["dark", true],
  ] as const)(
    "should return true when a resolvable image exists for %s theme",
    (theme, expected) => {
      expect(
        hasThemedImage({ imageUrlLight: "https://example.com/light.png", imageUrlDark: "" }, theme),
      ).toBe(expected);
    },
  );

  it("should return false when both themed urls are empty", () => {
    expect(hasThemedImage({ imageUrlLight: "", imageUrlDark: "" }, "light")).toBe(false);
  });

  it.each([
    ["light", "  \n  "],
    ["dark", "  \t  "],
  ] as const)("should return false when the resolvable %s url is whitespace only", (theme, url) => {
    const urls = {
      imageUrlLight: theme === "light" ? url : "",
      imageUrlDark: theme === "dark" ? url : "",
    };

    expect(hasThemedImage(urls, theme)).toBe(false);
  });

  it("should return true when the resolvable url has surrounding whitespace", () => {
    expect(
      hasThemedImage(
        { imageUrlLight: "  https://example.com/light.png  ", imageUrlDark: "" },
        "light",
      ),
    ).toBe(true);
  });
});
