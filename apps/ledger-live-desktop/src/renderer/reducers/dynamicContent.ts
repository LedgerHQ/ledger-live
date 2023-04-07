import { handleActions } from "redux-actions";
import { NotificationContentCard, PortfolioContentCard } from "~/types/dynamicContent";

export type DynamicContentState = {
  portfolioCards: PortfolioContentCard[];
  notificationsCards: NotificationContentCard[];
};

const state: DynamicContentState = {
  portfolioCards: [],
  notificationsCards: [],
};

const handlers = {
  DYNAMIC_CONTENT_SET_PORTFOLIO_CARDS: (
    state: DynamicContentState,
    { payload }: { payload: PortfolioContentCard[] },
  ) => ({
    ...state,
    portfolioCards: payload,
  }),
  DYNAMIC_CONTENT_SET_NOTIFICATIONS_CARDS: (
    state: DynamicContentState,
    { payload }: { payload: NotificationContentCard[] },
  ) => ({
    ...state,
    notificationsCards: payload,
  }),
};

// Selectors

export const portfolioContentCardSelector = (state: { dynamicContent: DynamicContentState }) =>
  state.dynamicContent.portfolioCards;

export const notificationsContentCardSelector = (state: { dynamicContent: DynamicContentState }) =>
  state.dynamicContent.notificationsCards;

// Exporting reducer

export default handleActions(handlers, state);
