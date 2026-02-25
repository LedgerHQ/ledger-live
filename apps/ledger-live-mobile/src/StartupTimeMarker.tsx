import React from "react";
import { View } from "react-native";
import { logLastStartupEvents } from "LLM/utils/logLastStartupEvents";
import { STARTUP_EVENTS } from "LLM/utils/resolveStartupEvents";

let nativeMethodInvokedOnce = false;

// Store time from app launch to first React render
export const StartupTimeMarker = ({ children }: { children: React.ReactNode }) => {
  const onLayout = React.useCallback(() => {
    if (!nativeMethodInvokedOnce) {
      nativeMethodInvokedOnce = true;
      logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);
    }
  }, []);
  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
};
