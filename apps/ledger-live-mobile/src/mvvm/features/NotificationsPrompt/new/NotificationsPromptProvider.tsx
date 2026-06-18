import React, { useMemo } from "react";
import {
  NotificationsPromptProvider as FlowNotificationsPromptProvider,
  type NotificationsPromptContextValue as FlowNotificationsPromptContextValue,
  useNotificationsPromptContext,
} from "@features/flow-notification-prompt";
import { type InitPushNotificationsDataResult } from "LLM/features/NotificationsPrompt";
import { useNotificationsPromptTriggers } from "LLM/features/NotificationsPrompt/new/hooks/useNotificationsPromptTriggers";

type NotificationsPromptProviderProps = {
  children: React.ReactNode;
};

export type NotificationsPromptContextValue =
  FlowNotificationsPromptContextValue<InitPushNotificationsDataResult>;

export function useNotificationsContext() {
  return useNotificationsPromptContext<InitPushNotificationsDataResult>();
}

export function NotificationsPromptProvider({ children }: NotificationsPromptProviderProps) {
  const { notifyFlowCompleted, tryTriggerPushNotificationDrawerAfterInactivity } =
    useNotificationsPromptTriggers();

  const value = useMemo<NotificationsPromptContextValue>(
    () => ({
      notifyFlowCompleted,
      tryTriggerPushNotificationDrawerAfterInactivity,
    }),
    [notifyFlowCompleted, tryTriggerPushNotificationDrawerAfterInactivity],
  );

  return (
    <FlowNotificationsPromptProvider value={value}>{children}</FlowNotificationsPromptProvider>
  );
}
