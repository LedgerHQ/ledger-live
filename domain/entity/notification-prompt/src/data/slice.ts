import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  NotificationPromptHistoryInitialState,
  type NotificationPromptHistory,
  type NotificationPromptTarget,
} from "./schema";

type RecordPromptDismissedPayload = {
  target: NotificationPromptTarget;
  dismissedAt: number;
};

export type NotificationPromptRootState = {
  notificationPrompt: NotificationPromptHistory;
};

export const notificationPromptSlice = createSlice({
  name: "notificationPrompt",
  initialState: NotificationPromptHistoryInitialState,
  reducers: {
    recordPromptDismissed: (
      state,
      { payload: { target, dismissedAt } }: PayloadAction<RecordPromptDismissedPayload>,
    ) => {
      state.dismissedPromptAtListByTarget ??= {};
      state.dismissedPromptAtListByTarget[target] ??= [];
      state.dismissedPromptAtListByTarget[target].push(dismissedAt);

      if (target === "globalPushNotifications") {
        state.dismissedOptInDrawerAtList ??= [];
        state.dismissedOptInDrawerAtList.push(dismissedAt);
      }
    },
    recordLastAction: (state, { payload }: PayloadAction<number>) => {
      state.lastActionAt = payload;
    },
    replaceNotificationPromptHistory: (_, { payload }: PayloadAction<NotificationPromptHistory>) =>
      payload,
    resetNotificationPromptHistory: () => NotificationPromptHistoryInitialState,
  },
  selectors: {
    selectNotificationPromptHistory: state => state,
    selectDismissedPromptAtListByTarget: (state, target: NotificationPromptTarget) =>
      state.dismissedPromptAtListByTarget?.[target] ??
      (target === "globalPushNotifications" ? state.dismissedOptInDrawerAtList : undefined) ??
      [],
    selectLastNotificationPromptActionAt: state => state.lastActionAt,
  },
});

export const {
  recordPromptDismissed,
  recordLastAction,
  replaceNotificationPromptHistory,
  resetNotificationPromptHistory,
} = notificationPromptSlice.actions;

export const notificationPromptReducer = notificationPromptSlice.reducer;

export const {
  selectNotificationPromptHistory,
  selectDismissedPromptAtListByTarget,
  selectLastNotificationPromptActionAt,
} = notificationPromptSlice.getSelectors(
  (state: NotificationPromptRootState) => state.notificationPrompt,
);

export default notificationPromptReducer;
