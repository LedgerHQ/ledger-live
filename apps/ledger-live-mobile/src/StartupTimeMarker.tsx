import React from "react";
import { getTimeSinceStartup } from "react-native-startup-time";
import { View } from "react-native";

/**
 * Time from app cold start to first render of a screen.
 */
export let appStartupTime: number;

// Store time from app launch to first React render
export const StartupTimeMarker = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const onLayout = React.useCallback(() => {
    if (!appStartupTime) {
      // react-native-startup-time get startup timestamp by running a native module before react-native launch
      getTimeSinceStartup().then(time => {
        appStartupTime = time;
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(`Time since startup: ${time} ms`);
        }
      });
    }
  }, []);
  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
};
