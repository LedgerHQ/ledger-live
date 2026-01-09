import React from "react";
import { View } from "react-native";
import { LAST_STARTUP_EVENTS, logLastStartupEvents } from "LLM/utils/logLastStartupEvents";

let nativeMethodInvokedOnce = false;

// Store time from app launch to first React render
export const StartupTimeMarker = ({ children }: { children: React.ReactNode }) => {
  const onLayout = React.useCallback(() => {
    if (!nativeMethodInvokedOnce) {
      nativeMethodInvokedOnce = true;
      logLastStartupEvents(LAST_STARTUP_EVENTS.APP_STARTED);
    }
  }, []);
  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
};
