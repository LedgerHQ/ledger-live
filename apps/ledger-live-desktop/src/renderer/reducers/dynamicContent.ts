import type { Card as BrazeCard } from "@braze/web-sdk";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ActionContentCard,
  NotificationContentCard,
  PortfolioContentCard,
} from "~/types/dynamicContent";
import { SettingsState, trackingEnabledSelector } from "./settings";
import { State } from ".";

export type DynamicContentState = {
  desktopCards: BrazeCard[];
  portfolioCards: PortfolioContentCard[];
  actionCards: ActionContentCard[];
  notificationsCards: NotificationContentCard[];
};

const initialState: DynamicContentState = {
  desktopCards: [],
  portfolioCards: [],
  actionCards: [],
  notificationsCards: [],
};

const dynamicContentSlice = createSlice({
  name: "dynamicContent",
  initialState,
  reducers: {
    setDesktopCards: (state, action: PayloadAction<BrazeCard[]>) => {
      state.desktopCards = action.payload;
    },
    setPortfolioCards: (state, action: PayloadAction<PortfolioContentCard[]>) => {
      state.portfolioCards = action.payload;
    },
    setActionCards: (state, action: PayloadAction<ActionContentCard[]>) => {
      state.actionCards = action.payload;
    },
    setNotificationsCards: (state, action: PayloadAction<NotificationContentCard[]>) => {
      state.notificationsCards = action.payload;
    },
  },
});

export const { setDesktopCards, setPortfolioCards, setActionCards, setNotificationsCards } =
  dynamicContentSlice.actions;

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

export default dynamicContentSlice.reducer;
