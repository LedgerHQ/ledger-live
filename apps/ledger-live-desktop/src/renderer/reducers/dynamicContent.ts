
import { handleActions } from "redux-actions";
import type { PortfolioContentCard } from "~/types/dynamicContent";

export type DynamicContentState = {
  portfolioCards: PortfolioContentCard[],
};

const state: DynamicContentState = {
  portfolioCards: [],
};

const handlers = {
  DYNAMIC_CONTENT_SET_PORTFOLIO_CARDS: (
    state:DynamicContentState,
    { payload }: { payload: PortfolioContentCard[] },
  ) => ({
    ...state,
    portfolioCards: payload,
  }),
};

// Selectors

export const portfolioContentCardSelector = (state: { dynamicContent: DynamicContentState }) =>
  state.dynamicContent.portfolioCards;

// Exporting reducer

export default handleActions(handlers, state);
