import type { Card as BrazeCard } from "@braze/web-sdk";
import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import {
  ActionContentCard,
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
};

const state: DynamicContentState = {
  desktopCards: [],
  portfolioCards: [],
  bottomPortfolioCards: [],
  actionCards: [],
  notificationsCards: [],
};

type HandlersPayloads = {
  DYNAMIC_CONTENT_SET_DESKTOP_CARDS: BrazeCard[];
  DYNAMIC_CONTENT_SET_PORTFOLIO_CARDS: PortfolioContentCard[];
  DYNAMIC_CONTENT_SET_BOTTOM_PORTFOLIO_CARDS: PortfolioContentCard[];
  DYNAMIC_CONTENT_SET_ACTION_CARDS: ActionContentCard[];
  DYNAMIC_CONTENT_SET_NOTIFICATIONS_CARDS: NotificationContentCard[];
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
  state,
);
