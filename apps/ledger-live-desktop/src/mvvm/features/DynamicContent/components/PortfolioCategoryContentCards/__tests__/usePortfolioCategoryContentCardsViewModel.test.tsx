import { renderHook } from "tests/testSetup";
import type { Card as BrazeCard } from "@braze/web-sdk";

import { usePortfolioCategoryContentCardsViewModel } from "../usePortfolioCategoryContentCardsViewModel";
import { useDynamicContent } from "../../../hooks/useDynamicContent";
import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";

jest.mock("../../../hooks/useDynamicContent");

const mockUseDynamicContent = jest.mocked(useDynamicContent);

const CATEGORY: CategoryContentCard = {
  id: "category-1",
  categoryId: "alwayson",
  title: "Discover our devices",
  description: "",
  location: LocationContentCard.Portfolio,
  cardsLayout: ContentCardsLayout.carousel,
  cardsType: ContentCardsType.smallSquare,
  type: ContentCardsType.category,
  created: new Date("2026-01-01"),
  isDismissable: true,
};

const childCard: BrazeCard =
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  {
    id: "child-1",
    created: new Date("2026-01-02"),
    extras: {
      type: ContentCardsType.smallSquare,
      categoryId: "alwayson",
      title: "Nano Pod",
      media: "https://example.com/device.png",
      order: "0",
    },
  } as unknown as BrazeCard;

describe("usePortfolioCategoryContentCardsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns renderable portfolio categories", () => {
    mockUseDynamicContent.mockReturnValue({
      categoriesCards: [CATEGORY],
      categoryChildCards: [childCard],
      dismissCard: jest.fn(),
      dismissCards: jest.fn(),
      logClickCard: jest.fn(),
      trackContentCardEvent: jest.fn(),
    });

    const { result } = renderHook(() => usePortfolioCategoryContentCardsViewModel());

    expect(result.current.categories).toHaveLength(1);
  });

  it("drops categories whose children are not renderable", () => {
    const emptyChild: BrazeCard =
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {
        id: "empty-child",
        created: new Date("2026-01-02"),
        extras: {
          type: ContentCardsType.smallSquare,
          categoryId: "alwayson",
          order: "0",
        },
      } as unknown as BrazeCard;

    mockUseDynamicContent.mockReturnValue({
      categoriesCards: [CATEGORY],
      categoryChildCards: [emptyChild],
      dismissCard: jest.fn(),
      dismissCards: jest.fn(),
      logClickCard: jest.fn(),
      trackContentCardEvent: jest.fn(),
    });

    const { result } = renderHook(() => usePortfolioCategoryContentCardsViewModel());

    expect(result.current.categories).toHaveLength(0);
  });
});
