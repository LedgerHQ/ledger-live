import * as braze from "@braze/web-sdk";
import type { Card as BrazeCard } from "@braze/web-sdk";
import { act, renderHook } from "tests/testSetup";
import {
  DynamicContentState,
  INITIAL_STATE as DYNAMIC_CONTENT_INITIAL_STATE,
} from "~/renderer/reducers/dynamicContent";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import { useDynamicContent } from "../useDynamicContent";
import { trackContentCard } from "../../utils/trackContentCard";

jest.mock("../../utils/trackContentCard", () => ({
  trackContentCard: jest.fn(),
}));

jest.mock("@braze/web-sdk", () => ({
  ...require("tests/mocks/brazeWebSdk").getBrazeWebSdkJestMock(),
  logCardDismissal: jest.fn(),
}));

const logCardDismissal = jest.mocked(braze.logCardDismissal);
const mockTrackContentCard = jest.mocked(trackContentCard);

const CATEGORY: CategoryContentCard = {
  id: "category-1",
  categoryId: "alwayson",
  title: "Get a Ledger",
  description: "Secure your assets",
  location: LocationContentCard.Portfolio,
  cardsLayout: ContentCardsLayout.carousel,
  cardsType: ContentCardsType.smallSquare,
  type: ContentCardsType.category,
  created: new Date("2026-01-01"),
};

const childCard = (id: string): BrazeCard =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    id,
    extras: { categoryId: "alwayson", type: "small_square" },
  }) as unknown as BrazeCard;

const CHILD_A = childCard("child-a");
const CHILD_B = childCard("child-b");

const trackedUser = {
  ...SETTINGS_INITIAL_STATE,
  shareAnalytics: true,
  sharePersonalizedRecommandations: false,
};
const optedOutUser = { ...trackedUser, shareAnalytics: false };

const renderDynamicContent = (
  dynamicContent: Partial<DynamicContentState> = {
    categoriesCards: [CATEGORY],
    desktopCards: [CHILD_A, CHILD_B],
  },
  settings = trackedUser,
) =>
  renderHook(() => useDynamicContent(), {
    initialState: {
      dynamicContent: { ...DYNAMIC_CONTENT_INITIAL_STATE, ...dynamicContent },
      settings,
    },
  });

describe("useDynamicContent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should expose the categories and their child cards", () => {
    const { result } = renderDynamicContent();

    expect(result.current.categoriesCards).toEqual([CATEGORY]);
    expect(result.current.categoryChildCards).toEqual([CHILD_A, CHILD_B]);
  });

  it("should remove the dismissed card from the store", () => {
    const { result, store } = renderDynamicContent();

    act(() => {
      result.current.dismissCard("child-a");
    });

    expect(store.getState().dynamicContent.desktopCards).toEqual([CHILD_B]);
  });

  it("should dismiss every card at once when closing all", () => {
    const { result, store } = renderDynamicContent();

    act(() => {
      result.current.dismissCards(["child-a", "child-b"]);
    });

    expect(store.getState().dynamicContent.desktopCards).toEqual([]);
  });

  it("should remove the category itself when it is the dismissed card", () => {
    const { result, store } = renderDynamicContent();

    act(() => {
      result.current.dismissCard("category-1");
    });

    expect(store.getState().dynamicContent.categoriesCards).toEqual([]);
  });

  it("should report that nothing happened for a card it does not know", () => {
    const { result, store } = renderDynamicContent();
    const stateBefore = store.getState();

    let dismissed = true;
    act(() => {
      dismissed = result.current.dismissCards(["never-served"]);
    });

    expect(dismissed).toBe(false);
    expect(store.getState()).toBe(stateBefore);
  });

  it("should tell braze about the dismissal when the user is tracked", () => {
    const { result } = renderDynamicContent();

    act(() => {
      result.current.dismissCard("child-a");
    });

    expect(logCardDismissal).toHaveBeenCalledWith(CHILD_A);
  });

  it("should persist the dismissal locally instead of calling braze when the user opted out", () => {
    const { result, store } = renderDynamicContent(undefined, optedOutUser);

    act(() => {
      result.current.dismissCard("child-a");
    });

    expect(logCardDismissal).not.toHaveBeenCalled();
    expect(store.getState().settings.dismissedContentCards["child-a"]).toEqual(expect.any(Number));
  });

  it("should track content card analytics when the user is tracked", () => {
    const { result } = renderDynamicContent();

    act(() => {
      result.current.trackContentCardEvent(ContentCardEvent.Clicked, {
        campaign: "child-a",
        contentcard: "Card child-a",
      });
    });

    expect(mockTrackContentCard).toHaveBeenCalledWith(
      ContentCardEvent.Clicked,
      expect.objectContaining({
        campaign: "child-a",
      }),
    );
  });

  it("should not track content card analytics when the user opted out", () => {
    const { result } = renderDynamicContent(undefined, optedOutUser);

    act(() => {
      result.current.trackContentCardEvent(ContentCardEvent.Clicked, {
        campaign: "child-a",
        contentcard: "Card child-a",
      });
    });

    expect(mockTrackContentCard).not.toHaveBeenCalled();
  });

  it("should never send debug cards from the braze dev tools to braze", () => {
    const localChild = childCard("local-child");
    const { result, store } = renderDynamicContent({
      desktopCards: [CHILD_A],
      localCategoriesCards: [CATEGORY],
      localCategoryChildCards: [localChild],
    });

    act(() => {
      result.current.dismissCards(["local-child", "child-a"]);
    });

    expect(logCardDismissal).toHaveBeenCalledTimes(1);
    expect(logCardDismissal).toHaveBeenCalledWith(CHILD_A);
    expect(store.getState().dynamicContent.localCategoryChildCards).toEqual([]);
    expect(store.getState().dynamicContent.desktopCards).toEqual([]);
  });
});
