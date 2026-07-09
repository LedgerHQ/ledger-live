import { useEffect } from "react";
import { AppState } from "react-native";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";
import { useInitPushNotificationsData } from "./hooks/useInitPushNotificationsData";

export function NotificationsPromptBootstrap() {
  const { tryTriggerPushNotificationDrawerAfterInactivity } = useNotificationsContext();
  const initPushNotificationsData = useInitPushNotificationsData();

  useEffect(() => {
    initPushNotificationsData().then(tryTriggerPushNotificationDrawerAfterInactivity);
    // Run this effect only once
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        initPushNotificationsData();
      }
    });

    return () => subscription.remove();
  }, [initPushNotificationsData]);

  return null;
}
