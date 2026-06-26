import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  buildGenericAwarenessModalContentCardIdStatuses,
  filterDismissedGenericAwarenessModalContentCards,
  getGamDismissedCampaignIds,
} from "../genericAwarenessModalSlice";

const cards: GenericAwarenessModalContentCard[] = [
  {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id: "APP_START_intro",
    title: "",
    subtitle: "",
    imageUrlLight: "",
    imageUrlDark: "",
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

describe("buildGenericAwarenessModalContentCardIdStatuses", () => {
  it("should list stored campaign ids", () => {
    expect(buildGenericAwarenessModalContentCardIdStatuses(cards, {})).toEqual([
      { id: "2", inStore: true, dismissed: false },
      { id: "APP_START_intro", inStore: true, dismissed: false },
    ]);
  });

  it("should include dismissed APP_START ids removed from the store", () => {
    expect(
      buildGenericAwarenessModalContentCardIdStatuses([cards[1]!], {
        APP_START_intro: Date.now(),
      }),
    ).toEqual([
      { id: "2", inStore: true, dismissed: false },
      { id: "APP_START_intro", inStore: false, dismissed: true },
    ]);
  });

  it("should ignore dismissed classic content card ids unrelated to GAM", () => {
    expect(
      buildGenericAwarenessModalContentCardIdStatuses(cards, { top_wallet_promo: Date.now() }),
    ).toEqual([
      { id: "2", inStore: true, dismissed: false },
      { id: "APP_START_intro", inStore: true, dismissed: false },
    ]);
  });
});

describe("getGamDismissedCampaignIds", () => {
  it("should return dismissed APP_START and in-store GAM ids only", () => {
    expect(
      getGamDismissedCampaignIds(cards, {
        APP_START_intro: Date.now(),
        "2": Date.now(),
        top_wallet_promo: Date.now(),
      }),
    ).toEqual(["2", "APP_START_intro"]);
  });
});
