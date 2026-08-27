import React from "react";
import { InteractionManager, View } from "react-native";
import { fadeNativeSplash } from "LLM/features/LaunchScreen/fadeNativeSplash";
import { logLastStartupEvents } from "LLM/utils/logLastStartupEvents";
import { logStartupEvent } from "LLM/utils/logStartupTime";
import { STARTUP_EVENTS } from "LLM/utils/resolveStartupEvents";
import { consumeFirstHomeLayout } from "LLM/utils/startupTimeMarkerState";
import { preloadIdleTabNavigators } from "~/components/RootNavigator/lazyScreen";

export { afterFirstHomeLayout, resetStartupTimeMarker } from "LLM/utils/startupTimeMarkerState";

export const StartupTimeMarker = ({ children }: { children: React.ReactNode }) => {
  const onLayout = React.useCallback(() => {
    if (!consumeFirstHomeLayout()) return;
    if (fadeNativeSplash()) {
      void logLastStartupEvents(STARTUP_EVENTS.NAV_READY);
    }
    logStartupEvent(STARTUP_EVENTS.FIRST_PAINT);
    logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);
    InteractionManager.runAfterInteractions(() => {
      logStartupEvent(STARTUP_EVENTS.TTI);
    });
    setTimeout(() => {
      preloadIdleTabNavigators();
    }, 200);
  }, []);
  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
};
