import type { Card as BrazeCard } from "@braze/web-sdk";
import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import {
  ActionContentCard,
  CategoryContentCard,
  NotificationContentCard,
  PortfolioContentCard,
} from "~/types/dynamicContent";
import { Handlers } from "./types";
import { SettingsState, trackingEnabledSelector } from "./settings";
import { State } from ".";

export type DynamicContentState = {
  desktopCards: BrazeCard[];
  /** Cards for placement "portfolio" (top carousel) */
  portfolioCards: PortfolioContentCard[];
  /** Cards for placement "bottom_portfolio" (bottom carousel) */
  bottomPortfolioCards: PortfolioContentCard[];
  actionCards: ActionContentCard[];
  notificationsCards: NotificationContentCard[];
  /** Category container cards, grouping child cards that share their categoryId */
  categoriesCards: CategoryContentCard[];
  /** Debug categories from the Braze dev tools, merged in selectors so Braze pushes don't wipe them */
  localCategoriesCards: CategoryContentCard[];
  /** Debug category children from the Braze dev tools, merged in selectors */
  localCategoryChildCards: BrazeCard[];
};

export const INITIAL_STATE: DynamicContentState = {
  desktopCards: [],
  portfolioCards: [],
  bottomPortfolioCards: [],
  actionCards: [],
  notificationsCards: [],
  categoriesCards: [],
  localCategoriesCards: [],
  localCategoryChildCards: [],
};

type HandlersPayloads = {
  DYNAMIC_CONTENT_SET_DESKTOP_CARDS: BrazeCard[];
  DYNAMIC_CONTENT_SET_PORTFOLIO_CARDS: PortfolioContentCard[];
  DYNAMIC_CONTENT_SET_BOTTOM_PORTFOLIO_CARDS: PortfolioContentCard[];
  DYNAMIC_CONTENT_SET_ACTION_CARDS: ActionContentCard[];
  DYNAMIC_CONTENT_SET_NOTIFICATIONS_CARDS: NotificationContentCard[];
  DYNAMIC_CONTENT_SET_CATEGORIES_CARDS: CategoryContentCard[];
  DYNAMIC_CONTENT_SET_LOCAL_CATEGORY_CARDS: {
    categories: CategoryContentCard[];
    childCards: BrazeCard[];
  };
  DYNAMIC_CONTENT_ADD_LOCAL_CONTENT_CARDS: {
    category: CategoryContentCard;
    cards: BrazeCard[];
  };
};
type DynamicContentHandlers<PreciseKey = true> = Handlers<
  DynamicContentState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: DynamicContentHandlers = {
  DYNAMIC_CONTENT_SET_DESKTOP_CARDS: (
    state: DynamicContentState,
    { payload }: { payload: BrazeCard[] },
  ) => ({
    ...state,
    desktopCards: payload,
  }),
  DYNAMIC_CONTENT_SET_PORTFOLIO_CARDS: (
    state: DynamicContentState,
    { payload }: { payload: PortfolioContentCard[] },
  ) => ({
    ...state,
    portfolioCards: payload,
  }),
  DYNAMIC_CONTENT_SET_BOTTOM_PORTFOLIO_CARDS: (
    state: DynamicContentState,
    { payload }: { payload: PortfolioContentCard[] },
  ) => ({
    ...state,
    bottomPortfolioCards: payload,
  }),
  DYNAMIC_CONTENT_SET_ACTION_CARDS: (
    state: DynamicContentState,
    { payload }: { payload: ActionContentCard[] },
  ) => ({
    ...state,
    actionCards: payload,
  }),
  DYNAMIC_CONTENT_SET_NOTIFICATIONS_CARDS: (
    state: DynamicContentState,
    { payload }: { payload: NotificationContentCard[] },
  ) => ({
    ...state,
    notificationsCards: payload,
  }),
  DYNAMIC_CONTENT_SET_CATEGORIES_CARDS: (
    state: DynamicContentState,
    { payload }: { payload: CategoryContentCard[] },
  ) => ({
    ...state,
    categoriesCards: payload,
  }),
  DYNAMIC_CONTENT_SET_LOCAL_CATEGORY_CARDS: (
    state: DynamicContentState,
    { payload }: { payload: { categories: CategoryContentCard[]; childCards: BrazeCard[] } },
  ) => ({
    ...state,
    localCategoriesCards: payload.categories,
    localCategoryChildCards: payload.childCards,
  }),
  DYNAMIC_CONTENT_ADD_LOCAL_CONTENT_CARDS: (
    state: DynamicContentState,
    {
      payload,
    }: {
      payload: { category: CategoryContentCard; cards: BrazeCard[] };
    },
  ) => {
    const { category, cards } = payload;
    const existingCategory = category.categoryId
      ? state.localCategoriesCards.find(existing => existing.categoryId === category.categoryId)
      : undefined;
    const mergedCategory =
      existingCategory && category.categoryId
        ? {
            ...category,
            title: category.title || existingCategory.title,
            description: category.description || existingCategory.description,
            cta: category.cta || existingCategory.cta,
            link: category.link || existingCategory.link,
          }
        : category;
    const localCategoriesCardsWithoutSameId = mergedCategory.categoryId
      ? state.localCategoriesCards.filter(
          existing => existing.categoryId !== mergedCategory.categoryId,
        )
      : state.localCategoriesCards;

    return {
      ...state,
      localCategoriesCards: [...localCategoriesCardsWithoutSameId, mergedCategory],
      localCategoryChildCards: [...state.localCategoryChildCards, ...cards],
    };
  },
};

// Selectors

export const desktopContentCardSelector = (state: { dynamicContent: DynamicContentState }) =>
  state.dynamicContent.desktopCards;

export const portfolioContentCardSelector = (state: { dynamicContent: DynamicContentState }) =>
  state.dynamicContent.portfolioCards;

export const bottomPortfolioContentCardSelector = (state: {
  dynamicContent: DynamicContentState;
}) => state.dynamicContent.bottomPortfolioCards;

export const actionContentCardSelector = (state: { dynamicContent: DynamicContentState }) =>
  state.dynamicContent.actionCards;

export const categoriesContentCardSelector = createSelector(
  (state: { dynamicContent: DynamicContentState }) => state.dynamicContent.categoriesCards,
  (state: { dynamicContent: DynamicContentState }) => state.dynamicContent.localCategoriesCards,
  (categoriesCards, localCategoriesCards) => categoriesCards.concat(localCategoriesCards),
);

export const categoryChildCardsSelector = createSelector(
  (state: { dynamicContent: DynamicContentState }) => state.dynamicContent.desktopCards,
  (state: { dynamicContent: DynamicContentState }) => state.dynamicContent.localCategoryChildCards,
  (desktopCards, localCategoryChildCards) => desktopCards.concat(localCategoryChildCards),
);

export const categoriesContentCardFromBrazeSelector = (state: {
  dynamicContent: DynamicContentState;
}) => state.dynamicContent.categoriesCards;

export const localCategoriesContentCardSelector = (state: {
  dynamicContent: DynamicContentState;
}) => state.dynamicContent.localCategoriesCards;

export const localCategoryChildCardsSelector = (state: { dynamicContent: DynamicContentState }) =>
  state.dynamicContent.localCategoryChildCards;

type NotificationsContentCardState = {
  dynamicContent: DynamicContentState;
  settings: SettingsState;
};

export const notificationsContentCardSelector = createSelector(
  (state: NotificationsContentCardState) => state.dynamicContent.notificationsCards,
  (state: NotificationsContentCardState) => state.settings.anonymousUserNotifications,
  (state: NotificationsContentCardState) => trackingEnabledSelector(state as State),
  (notificationsCards, anonymousUserNotifications, trackingEnabled) =>
    notificationsCards.map(n => ({
      ...n,
      viewed: trackingEnabled ? n.viewed : !!anonymousUserNotifications[n.id],
    })),
);

// Exporting reducer

export default handleActions<DynamicContentState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as DynamicContentHandlers<false>,
  INITIAL_STATE,
);
