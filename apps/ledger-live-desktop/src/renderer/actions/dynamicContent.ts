import type { Card as BrazeCard } from "@braze/web-sdk";
import {
  ActionContentCard,
  CategoryContentCard,
  PortfolioContentCard,
  NotificationContentCard,
} from "~/types/dynamicContent";

export const setDesktopCards = (payload: BrazeCard[]) => ({
  type: "DYNAMIC_CONTENT_SET_DESKTOP_CARDS",
  payload,
});

export const setPortfolioCards = (payload: PortfolioContentCard[]) => ({
  type: "DYNAMIC_CONTENT_SET_PORTFOLIO_CARDS",
  payload,
});

export const setBottomPortfolioCards = (payload: PortfolioContentCard[]) => ({
  type: "DYNAMIC_CONTENT_SET_BOTTOM_PORTFOLIO_CARDS",
  payload,
});

export const setActionCards = (payload: ActionContentCard[]) => ({
  type: "DYNAMIC_CONTENT_SET_ACTION_CARDS",
  payload,
});

export const setNotificationsCards = (payload: NotificationContentCard[]) => ({
  type: "DYNAMIC_CONTENT_SET_NOTIFICATIONS_CARDS",
  payload,
});

export const setCategoriesCards = (payload: CategoryContentCard[]) => ({
  type: "DYNAMIC_CONTENT_SET_CATEGORIES_CARDS",
  payload,
});

export const setLocalCategoryCards = (payload: {
  categories: CategoryContentCard[];
  childCards: BrazeCard[];
}) => ({
  type: "DYNAMIC_CONTENT_SET_LOCAL_CATEGORY_CARDS",
  payload,
});

export const addLocalContentCards = (payload: {
  category: CategoryContentCard;
  cards: BrazeCard[];
}) => ({
  type: "DYNAMIC_CONTENT_ADD_LOCAL_CONTENT_CARDS",
  payload,
});
