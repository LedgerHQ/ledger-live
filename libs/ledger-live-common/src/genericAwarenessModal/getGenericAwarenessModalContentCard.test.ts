import { getGenericAwarenessModalContentCard } from "./getGenericAwarenessModalContentCard";
import { GenericAwarenessModalContentCard, GenericAwarenessModalLayout } from "./types";

const contentCards: GenericAwarenessModalContentCard[] = [
  {
    layout: GenericAwarenessModalLayout.Carousel,
    id: "APP_START_carousel",
    data: [],
  },
  {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id: "feature-intro",
    title: "Feature intro",
    subtitle: "Feature intro subtitle",
    imageUrl: "https://example.com/image.png",
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
