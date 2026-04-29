import React, { createContext, useContext, useMemo } from "react";
import {
  type InitPushNotificationsDataResult,
  type NotificationsPromptAfterActionSource,
} from "LLM/features/NotificationsPrompt";
import { useNotificationsPromptTriggers } from "LLM/features/NotificationsPrompt/new/hooks/useNotificationsPromptTriggers";

type NotificationsPromptProviderProps = {
  children: React.ReactNode;
};

export type NotificationsPromptContextValue = {
  notifyFlowCompleted: (source: NotificationsPromptAfterActionSource) => void;
  onInitialDataLoaded: (data: InitPushNotificationsDataResult) => void;
};

export const NotificationsPromptContext = createContext<NotificationsPromptContextValue | null>(
  null,
);

export function useNotificationsContext() {
  const context = useContext(NotificationsPromptContext);

  if (!context) {
    throw new Error("useNotificationsContext must be used within a NotificationsPromptProvider");
  }

  return context;
}

export function NotificationsPromptProvider({ children }: NotificationsPromptProviderProps) {
  const { notifyFlowCompleted, tryTriggerPushNotificationDrawerAfterInactivity } =
    useNotificationsPromptTriggers();

  const value = useMemo(
    () => ({
      notifyFlowCompleted,
      onInitialDataLoaded: tryTriggerPushNotificationDrawerAfterInactivity,
    }),
    [notifyFlowCompleted, tryTriggerPushNotificationDrawerAfterInactivity],
  );

  return (
    <NotificationsPromptContext.Provider value={value}>
      {children}
    </NotificationsPromptContext.Provider>
  );
}
