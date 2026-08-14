import React from "react";
import { renderHook } from "tests/testSetup";
import type { Card as BrazeCard } from "@braze/web-sdk";

import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";
import { useContentCardsCategoryViewModel } from "../useContentCardsCategoryViewModel";
import { useDynamicContent } from "../../../hooks/useDynamicContent";
import { openURL } from "~/renderer/linking";

jest.mock("../../../hooks/useDynamicContent");
jest.mock("LLD/features/DynamicContent/utils/trackContentCard");
jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const mockUseDynamicContent = jest.mocked(useDynamicContent);

const CATEGORY: CategoryContentCard = {
  id: "category-1",
  categoryId: "alwayson",
  title: "Discover our devices",
  description: "",
  cta: "Explore all",
  link: "ledger-live:/market",
  location: LocationContentCard.Portfolio,
  cardsLayout: ContentCardsLayout.carousel,
  cardsType: ContentCardsType.smallSquare,
  type: ContentCardsType.category,
  created: new Date("2026-01-01"),
  isDismissable: true,
};

const childCard = (id: string, order: string, link?: string): BrazeCard =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    id,
    created: new Date("2026-01-02"),
    extras: {
      platform: "desktop",
      type: ContentCardsType.smallSquare,
      categoryId: "alwayson",
      title: `Card ${id}`,
      media: "https://example.com/device.png",
      mediaType: "image",
      order,
      link,
    },
  }) as unknown as BrazeCard;

describe("useContentCardsCategoryViewModel", () => {
  const dismissCard = jest.fn();
  const logClickCard = jest.fn();
  const trackContentCardEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDynamicContent.mockReturnValue({
      categoriesCards: [],
      categoryChildCards: [],
      dismissCard,
      dismissCards: jest.fn(),
      logClickCard,
      trackContentCardEvent,
    });
  });

  it("sorts slides by order and offsets displayedPosition when a leading slide is present", () => {
    const { result } = renderHook(() =>
      useContentCardsCategoryViewModel({
        category: CATEGORY,
        categoryContentCards: [
          childCard("child-2", "2"),
          childCard("child-1", "1"),
        ],
        leadingSlide: <div>Leading</div>,
      }),
    );

    expect(result.current.slides.map(slide => slide.card.id)).toEqual(["child-1", "child-2"]);
    expect(result.current.slides.map(slide => slide.displayedPosition)).toEqual([1, 2]);
  });

  it("drops child cards that would render empty", () => {
    const emptyCard = {
      id: "empty",
      created: new Date("2026-01-02"),
      extras: {
        type: ContentCardsType.smallSquare,
        categoryId: "alwayson",
        order: "0",
      },
    } as unknown as BrazeCard;

    const { result } = renderHook(() =>
      useContentCardsCategoryViewModel({
        category: CATEGORY,
        categoryContentCards: [emptyCard, childCard("child-1", "1")],
      }),
    );

    expect(result.current.slides).toHaveLength(1);
    expect(result.current.slides[0]?.card.id).toBe("child-1");
  });

  it("navigates in-app when a child card uses a ledger-live deeplink", () => {
    const { result } = renderHook(() =>
      useContentCardsCategoryViewModel({
        category: CATEGORY,
        categoryContentCards: [childCard("child-1", "1", "ledger-live:/market")],
      }),
    );

    result.current.onCardClick(result.current.slides[0]!.card, 0);

    expect(trackContentCardEvent).toHaveBeenCalledWith(
      ContentCardEvent.Clicked,
      expect.objectContaining({
        campaign: "child-1",
        contentcard: "Card child-1",
      }),
    );
    expect(logClickCard).toHaveBeenCalledWith("child-1");
    expect(mockNavigate).toHaveBeenCalledWith("/market", { state: { source: "banner" } });
    expect(openURL).not.toHaveBeenCalled();
  });

  it("routes the header CTA through the same deeplink handler", () => {
    const { result } = renderHook(() =>
      useContentCardsCategoryViewModel({
        category: CATEGORY,
        categoryContentCards: [childCard("child-1", "1")],
      }),
    );

    result.current.onHeaderCtaPress?.();

    expect(mockNavigate).toHaveBeenCalledWith("/market", { state: { source: "banner" } });
    expect(openURL).not.toHaveBeenCalled();
  });

  it("tracks dismiss analytics only when dismissCard succeeds", () => {
    dismissCard.mockReturnValueOnce(false).mockReturnValueOnce(true);

    const { result } = renderHook(() =>
      useContentCardsCategoryViewModel({
        category: CATEGORY,
        categoryContentCards: [childCard("child-1", "1")],
      }),
    );

    const card = result.current.slides[0]!.card;

    result.current.onCardDismiss(card, 0);
    expect(trackContentCardEvent).not.toHaveBeenCalled();

    result.current.onCardDismiss(card, 0);
    expect(trackContentCardEvent).toHaveBeenCalledWith(
      ContentCardEvent.Dismissed,
      expect.objectContaining({
        campaign: "child-1",
      }),
    );
  });
});
