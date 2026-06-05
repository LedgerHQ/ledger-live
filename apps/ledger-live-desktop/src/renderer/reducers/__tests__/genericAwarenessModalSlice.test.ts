import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import { filterDismissedGenericAwarenessModalContentCards } from "../genericAwarenessModalSlice";

const cards: GenericAwarenessModalContentCard[] = [
  {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id: "APP_START_intro",
    title: "",
    subtitle: "",
    imageUrl: "",
    primaryButtonLabel: "",
    primaryButtonLink: "",
    secondaryButtonLabel: "",
    secondaryButtonLink: "",
    items: [],
    isReady: true,
  },
  {
    layout: GenericAwarenessModalLayout.Carousel,
    id: "2",
    data: [],
    isReady: true,
  },
];

describe("filterDismissedGenericAwarenessModalContentCards", () => {
  it("should return all cards when dismissed list is empty", () => {
    expect(filterDismissedGenericAwarenessModalContentCards(cards, [])).toEqual(cards);
  });

  it("should exclude dismissed campaign ids", () => {
    const result = filterDismissedGenericAwarenessModalContentCards(cards, ["APP_START_intro"]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("2");
  });
});
