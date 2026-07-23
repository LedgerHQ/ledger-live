import { markLocalCardsViewed, addLocalContentCards } from "~/actions/dynamicContent";
import reducer, {
  INITIAL_STATE,
  assetsCardsSelector,
  landingPageStickyCtaCardsSelector,
  notificationsCardsSelector,
} from "./dynamicContent";
import type { BrazeContentCard, CategoryContentCard } from "~/dynamicContent/types";
import {
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
  LandingPageUseCase,
} from "~/dynamicContent/types";
import type { State } from "./types";

const localCard = (id: string, viewed: boolean): BrazeContentCard =>
  ({ id, viewed, extras: {} }) as unknown as BrazeContentCard;

const localPlacementCard = (
  id: string,
  location: ContentCardLocation,
  order: string,
): BrazeContentCard =>
  ({
    id,
    created: 2000,
    viewed: false,
    extras: { location, order, landingPage: LandingPageUseCase.LP_Stake },
  }) as unknown as BrazeContentCard;

const localCategory = (id: string, categoryId: string, cardsType: ContentCardsType) =>
  ({
    id,
    categoryId,
    cardsType,
    cardsLayout: ContentCardsLayout.unique,
    type: ContentCardsType.category,
    createdAt: 1000,
    viewed: false,
  }) as unknown as CategoryContentCard;

test("markLocalCardsViewed flips viewed only on the matching local cards", () => {
  const state = {
    ...INITIAL_STATE,
    localMobileCards: [localCard("a", false), localCard("b", false)],
  };

  const next = reducer(state, markLocalCardsViewed(["a"]));

  expect(next.localMobileCards.find(c => c.id === "a")?.viewed).toBe(true);
  expect(next.localMobileCards.find(c => c.id === "b")?.viewed).toBe(false);
});

test("addLocalContentCards replaces the existing local category sharing a categoryId, instead of stacking a second one that would conflict", () => {
  const hero = localCategory("alwayson-category-1", "alwayson", ContentCardsType.hero);
  const withHero = reducer(
    INITIAL_STATE,
    addLocalContentCards({ category: hero, cards: [localCard("hero-child", false)] }),
  );
  expect(withHero.localCategoriesCards).toEqual([hero]);

  const action = localCategory("alwayson-category-2", "alwayson", ContentCardsType.action);
  const withAction = reducer(
    withHero,
    addLocalContentCards({ category: action, cards: [localCard("action-child", false)] }),
  );

  expect(withAction.localCategoriesCards).toEqual([action]);
  // Children aren't pruned - only the category shell is replaced.
  expect(withAction.localMobileCards.map(c => c.id)).toEqual(["hero-child", "action-child"]);
});

test("addLocalContentCards keeps existing local categories when the new category has no categoryId", () => {
  const existing = localCategory("existing-category", "alwayson", ContentCardsType.hero);
  const categoryWithoutId = {
    ...localCategory("category-without-id", "unused", ContentCardsType.action),
    categoryId: undefined,
  };

  const next = reducer(
    { ...INITIAL_STATE, localCategoriesCards: [existing] },
    addLocalContentCards({
      category: categoryWithoutId,
      cards: [localCard("category-without-id-child", false)],
    }),
  );

  expect(next.localCategoriesCards).toEqual([existing, categoryWithoutId]);
});

test("placement selectors sort merged local cards with the same ordering semantics as Braze cards", () => {
  const state = {
    dynamicContent: {
      ...INITIAL_STATE,
      assetsCards: [
        {
          id: "braze-asset-card",
          order: 2,
          createdAt: 1000,
        },
      ],
      notificationCards: [
        {
          id: "braze-notification-card",
          order: 2,
          createdAt: 1000,
        },
      ],
      landingPageStickyCtaCards: [
        {
          id: "braze-sticky-cta-card",
          order: 2,
          createdAt: 1000,
          cta: "Braze",
          landingPage: LandingPageUseCase.LP_Stake,
        },
      ],
      localMobileCards: [
        localPlacementCard("local-asset-card", ContentCardLocation.Asset, "1"),
        localPlacementCard("local-notification-card", ContentCardLocation.NotificationCenter, "1"),
        localPlacementCard("local-sticky-cta-card", ContentCardLocation.LandingPageStickyCta, "1"),
      ],
    },
  } as unknown as State;

  expect(assetsCardsSelector(state).map(card => card.id)).toEqual([
    "local-asset-card",
    "braze-asset-card",
  ]);
  expect(notificationsCardsSelector(state).map(card => card.id)).toEqual([
    "local-notification-card",
    "braze-notification-card",
  ]);
  expect(landingPageStickyCtaCardsSelector(state).map(card => card.id)).toEqual([
    "local-sticky-cta-card",
    "braze-sticky-cta-card",
  ]);
});

test("landingPageStickyCtaCardsSelector leaves Braze-only sticky CTA cards unchanged", () => {
  const landingPageStickyCtaCards = [
    {
      id: "braze-sticky-cta-card",
      order: 2,
      createdAt: 1000,
      cta: "Braze",
      landingPage: LandingPageUseCase.LP_Stake,
    },
  ];
  const state = {
    dynamicContent: {
      ...INITIAL_STATE,
      landingPageStickyCtaCards,
      localMobileCards: [],
    },
  } as unknown as State;

  expect(landingPageStickyCtaCardsSelector(state)).toBe(landingPageStickyCtaCards);
});
