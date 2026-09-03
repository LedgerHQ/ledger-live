import React, { createContext, useContext, useEffect, useMemo } from "react";
import { AppState } from "react-native";
import type {
  InitPushNotificationsDataResult,
  NotificationPromptTarget,
} from "LLM/features/NotificationsPrompt/types";
import type {
  NotificationsPromptAfterActionSource,
  NotificationsPromptSource,
} from "LLM/features/NotificationsPrompt/utils/notificationsPromptEngine";
import { useNotificationsPromptTriggers } from "LLM/features/NotificationsPrompt/new/hooks/useNotificationsPromptTriggers";

type NotificationsPromptProviderProps = {
  children?: React.ReactNode;
};

export type NotificationsPromptContextValue = {
  notifyFlowCompleted: (source: NotificationsPromptAfterActionSource) => void;
  tryTriggerPushNotificationDrawerAfterInactivity: (data: InitPushNotificationsDataResult) => void;
  initPushNotificationsData: () => Promise<InitPushNotificationsDataResult>;
  openDrawer: (
    source: NotificationsPromptSource,
    timer?: number,
    drawerPromptTarget?: NotificationPromptTarget,
  ) => void;
  isDrawerPending: () => boolean;
  cancelPendingDrawer: () => void;
};

export const NotificationsPromptContext = createContext<NotificationsPromptContextValue | null>(
  null,
);

export function useNotificationsPrompt() {
  const context = useContext(NotificationsPromptContext);

  if (!context) {
    throw new Error("useNotificationsPrompt must be used within a NotificationsPromptProvider");
  }

  return context;
}

export function NotificationsPromptProvider({ children }: NotificationsPromptProviderProps) {
  const {
    notifyFlowCompleted,
    tryTriggerPushNotificationDrawerAfterInactivity,
    initPushNotificationsData,
    openDrawer,
    isDrawerPending,
    cancelPendingDrawer,
  } = useNotificationsPromptTriggers();

  useEffect(() => {
    initPushNotificationsData().then(tryTriggerPushNotificationDrawerAfterInactivity);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-read OS permission and stored opt-in data when the app returns to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        initPushNotificationsData();
      }
    });

    return () => subscription.remove();
  }, [initPushNotificationsData]);

  const value = useMemo(
    () => ({
      notifyFlowCompleted,
      tryTriggerPushNotificationDrawerAfterInactivity,
      initPushNotificationsData,
      openDrawer,
      isDrawerPending,
      cancelPendingDrawer,
    }),
    [
      notifyFlowCompleted,
      openDrawer,
      isDrawerPending,
      cancelPendingDrawer,
      tryTriggerPushNotificationDrawerAfterInactivity,
      initPushNotificationsData,
    ],
  );

  return (
    <NotificationsPromptContext.Provider value={value}>
      {children}
    </NotificationsPromptContext.Provider>
  );
}
