import React from "react";
import {
  NotificationsPromptProvider as FlowNotificationsPromptProvider,
  type NotificationsPromptContextValue as FlowNotificationsPromptContextValue,
  useNotificationsPromptContext,
} from "@features/flow-notification-prompt";
import { type InitPushNotificationsDataResult } from "LLM/features/NotificationsPrompt";
import { useNotificationsPromptProviderViewModel } from "./useNotificationsPromptProviderViewModel";

type NotificationsPromptProviderProps = {
  children: React.ReactNode;
};

export type NotificationsPromptContextValue =
  FlowNotificationsPromptContextValue<InitPushNotificationsDataResult>;

export function useNotificationsContext() {
  return useNotificationsPromptContext<InitPushNotificationsDataResult>();
}

export function NotificationsPromptProvider({ children }: NotificationsPromptProviderProps) {
  const value = useNotificationsPromptProviderViewModel();

  return (
    <FlowNotificationsPromptProvider value={value}>{children}</FlowNotificationsPromptProvider>
  );
}
