import { ActionContentCard, PortfolioContentCard } from "~/types/dynamicContent";

export const setPortfolioCards = (payload: PortfolioContentCard[]) => ({
  type: "DYNAMIC_CONTENT_SET_PORTFOLIO_CARDS",
  payload,
});

export const setActionCards = (payload: ActionContentCard[]) => ({
  type: "DYNAMIC_CONTENT_SET_ACTION_CARDS",
  payload,
});

export const setNotificationsCards = (payload: PortfolioContentCard[]) => ({
  type: "DYNAMIC_CONTENT_SET_NOTIFICATIONS_CARDS",
  payload,
});
