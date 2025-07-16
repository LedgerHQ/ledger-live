import type { Card as BrazeCard } from "@braze/web-sdk";
import { handleActions } from "redux-actions";
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
  portfolioCards: PortfolioContentCard[];
  actionCards: ActionContentCard[];
  notificationsCards: NotificationContentCard[];
};

const state: DynamicContentState = {
  desktopCards: [],
  portfolioCards: [],
  actionCards: [],
  notificationsCards: [],
};

type HandlersPayloads = {
  DYNAMIC_CONTENT_SET_DESKTOP_CARDS: BrazeCard[];
  DYNAMIC_CONTENT_SET_PORTFOLIO_CARDS: PortfolioContentCard[];
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

export const actionContentCardSelector = (state: { dynamicContent: DynamicContentState }) =>
  state.dynamicContent.actionCards;

export const notificationsContentCardSelector = (state: {
  dynamicContent: DynamicContentState;
  settings: SettingsState;
}) => {
  const { settings, dynamicContent } = state;
  return dynamicContent.notificationsCards.map(n => ({
    ...n,
    viewed: trackingEnabledSelector(state as State)
      ? n.viewed
      : !!settings.anonymousUserNotifications[n.id],
  }));
};

// Exporting reducer

export default handleActions<DynamicContentState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as DynamicContentHandlers<false>,
  state,
);
