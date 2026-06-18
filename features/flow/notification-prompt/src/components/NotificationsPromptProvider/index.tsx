import { createContext, useContext, type ReactNode } from "react";
import type { NotificationPromptAfterActionSource } from "@domain/entity-notification-prompt";

export type NotificationsPromptContextValue<TInactivityPayload = unknown> = {
  notifyFlowCompleted: (source: NotificationPromptAfterActionSource) => void;
  tryTriggerPushNotificationDrawerAfterInactivity: (data: TInactivityPayload) => void;
};

type NotificationsPromptProviderProps<TInactivityPayload = unknown> = {
  children: ReactNode;
  value: NotificationsPromptContextValue<TInactivityPayload>;
};

const NotificationsPromptContext = createContext<NotificationsPromptContextValue | null>(null);

export function useNotificationsPromptContext<TInactivityPayload = unknown>() {
  const context = useContext(NotificationsPromptContext);

  if (!context) {
    throw new Error(
      "useNotificationsPromptContext must be used within a NotificationsPromptProvider",
    );
  }

  return context as NotificationsPromptContextValue<TInactivityPayload>;
}

export function NotificationsPromptProvider<TInactivityPayload = unknown>({
  children,
  value,
}: NotificationsPromptProviderProps<TInactivityPayload>) {
  return (
    <NotificationsPromptContext.Provider value={value as NotificationsPromptContextValue}>
      {children}
    </NotificationsPromptContext.Provider>
  );
}
