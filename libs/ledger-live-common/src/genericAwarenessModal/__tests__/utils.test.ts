import {
  createThemedImageUrls,
  getGenericAwarenessModalContentCard,
  hasAwarenessModalActionButton,
  hasAwarenessModalActionLink,
  hasThemedImage,
  resolveAwarenessModalActionLink,
  resolveCarouselNavigationButtonLabel,
  resolveThemedImageUrl,
} from "../utils";
import { GenericAwarenessModalContentCard, GenericAwarenessModalLayout } from "../types";

describe("hasAwarenessModalActionButton", () => {
  it.each([
    ["Primary", "https://example.com", true],
    ["", "https://example.com", false],
    ["Primary", "", true],
    ["", "", false],
    ["   ", "https://example.com", false],
    ["Primary", "   ", true],
    ["  Primary  ", "  https://example.com  ", true],
  ] as const)("should return %s when label is %j and link is %j", (label, link, expected) => {
    expect(hasAwarenessModalActionButton(label, link)).toBe(expected);
  });
});

describe("resolveAwarenessModalActionLink", () => {
  it.each([
    ["https://example.com", "https://example.com"],
    ["  ledgerlive://buy  ", "ledgerlive://buy"],
    ["", undefined],
    ["   ", undefined],
  ] as const)("should resolve %j to %j", (link, expected) => {
    expect(resolveAwarenessModalActionLink(link)).toBe(expected);
  });
});

describe("hasAwarenessModalActionLink", () => {
  it.each([
    ["https://example.com", true],
    ["  ledgerlive://buy  ", true],
    ["", false],
    ["   ", false],
  ] as const)("should return %s for link %j", (link, expected) => {
    expect(hasAwarenessModalActionLink(link)).toBe(expected);
  });
});

describe("resolveCarouselNavigationButtonLabel", () => {
  it.each([
    ["", "Continue", "Continue"],
    ["   ", "Close", "Close"],
    ["Next step", "Continue", "Next step"],
    ["  Done  ", "Close", "Done"],
  ] as const)(
    "should return %j when navigationButtonLabel is %j and default is %j",
    (navigationButtonLabel, defaultLabel, expectedLabel) => {
      expect(resolveCarouselNavigationButtonLabel(navigationButtonLabel, defaultLabel)).toBe(
        expectedLabel,
      );
    },
  );
});

describe("createThemedImageUrls", () => {
  it("should map a single url to both light and dark themed fields", () => {
    expect(createThemedImageUrls("https://example.com/image.png")).toEqual({
      imageUrlLight: "https://example.com/image.png",
      imageUrlDark: "https://example.com/image.png",
    });
  });

  it("should fall back to empty strings when url is undefined", () => {
    expect(createThemedImageUrls(undefined)).toEqual({
      imageUrlLight: "",
      imageUrlDark: "",
    });
  });
});

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
    const themedUrls = {
      imageUrlLight: theme === "light" ? inputUrl : "https://example.com/light.png",
      imageUrlDark: theme === "dark" ? inputUrl : "https://example.com/dark.png",
    };

    expect(resolveThemedImageUrl(themedUrls, theme)).toBe(expectedUrl);
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
    const themedUrls = {
      imageUrlLight: theme === "light" ? url : "",
      imageUrlDark: theme === "dark" ? url : "",
    };

    expect(hasThemedImage(themedUrls, theme)).toBe(false);
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

const contentCards: GenericAwarenessModalContentCard[] = [
  {
    layout: GenericAwarenessModalLayout.Carousel,
    id: "APP_START_carousel",
    data: [],
    isReady: false,
  },
  {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id: "feature-intro",
    isReady: false,
    title: "Feature intro",
    subtitle: "Feature intro subtitle",
    imageUrlLight: "https://example.com/image.png",
    imageUrlDark: "",
    primaryButtonLabel: "Primary",
    primaryButtonLink: "ledgerlive://primary",
    secondaryButtonLabel: "Secondary",
    secondaryButtonLink: "ledgerlive://secondary",
    items: [],
  },
];

describe("getGenericAwarenessModalContentCard", () => {
  it("should return the first app start card when id is not provided", () => {
    expect(getGenericAwarenessModalContentCard(contentCards)).toBe(contentCards[0]);
  });

  it("should return the card matching the provided id", () => {
    expect(getGenericAwarenessModalContentCard(contentCards, "feature-intro")).toBe(
      contentCards[1],
    );
  });

  it("should return undefined when no app start card exists and id is not provided", () => {
    expect(getGenericAwarenessModalContentCard([contentCards[1]])).toBeUndefined();
  });

  it("should return undefined when no card matches the provided id", () => {
    expect(getGenericAwarenessModalContentCard(contentCards, "missing")).toBeUndefined();
  });
});
