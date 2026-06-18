import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { NotificationPromptSource, NotificationPromptTarget } from "@domain/entity-notification-prompt";

export type NotificationPromptIntent =
  | {
      type: "accept";
      target: NotificationPromptTarget;
    }
  | {
      type: "dismiss";
      target: NotificationPromptTarget;
      dismissedAt: number;
    };

export type NotificationPromptDrawerState = {
  isOpen: boolean;
  source: NotificationPromptSource | null;
  target: NotificationPromptTarget | null;
  pendingIntent: NotificationPromptIntent | null;
};

export type NotificationPromptFlowRootState = {
  notificationPromptFlow: NotificationPromptDrawerState;
};

const initialState: NotificationPromptDrawerState = {
  isOpen: false,
  source: null,
  target: null,
  pendingIntent: null,
};

export const notificationPromptFlowSlice = createSlice({
  name: "notificationPromptFlow",
  initialState,
  reducers: {
    openNotificationPromptDrawer: (
      state,
      {
        payload,
      }: PayloadAction<{
        source: NotificationPromptSource;
        target: NotificationPromptTarget;
      }>,
    ) => {
      state.isOpen = true;
      state.source = payload.source;
      state.target = payload.target;
      state.pendingIntent = null;
    },
    closeNotificationPromptDrawer: state => {
      state.isOpen = false;
      state.source = null;
      state.target = null;
    },
    emitNotificationPromptIntent: (state, { payload }: PayloadAction<NotificationPromptIntent>) => {
      state.pendingIntent = payload;
    },
    clearNotificationPromptIntent: state => {
      state.pendingIntent = null;
    },
  },
  selectors: {
    selectNotificationPromptDrawer: state => state,
    selectNotificationPromptIntent: state => state.pendingIntent,
  },
});

export const {
  openNotificationPromptDrawer,
  closeNotificationPromptDrawer,
  emitNotificationPromptIntent,
  clearNotificationPromptIntent,
} = notificationPromptFlowSlice.actions;

export const notificationPromptFlowReducer = notificationPromptFlowSlice.reducer;

export const { selectNotificationPromptDrawer, selectNotificationPromptIntent } =
  notificationPromptFlowSlice.getSelectors(
    (state: NotificationPromptFlowRootState) => state.notificationPromptFlow,
  );

export default notificationPromptFlowReducer;
