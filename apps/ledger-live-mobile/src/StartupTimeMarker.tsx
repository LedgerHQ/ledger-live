import React from "react";
import { getTimeSinceStartup } from "react-native-startup-time";
import { View } from "react-native";

/**
 * Time from app cold start to first render of a screen.
 */
export let appStartupTime: number;
let nativeMethodInvokedOnce = false;

// Store time from app launch to first React render
export const StartupTimeMarker = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const onLayout = React.useCallback(() => {
    if (!nativeMethodInvokedOnce) {
      // react-native-startup-time get startup timestamp by running a native module before react-native launch
      getTimeSinceStartup()
        .then(time => {
          appStartupTime = time;
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(`Time since startup: ${time} ms`);
          }
        })
        .catch(() => {
          /**
           * We can safely ignore this.
           * getTimeSinceStartup() rejects the promise in case it's called more
           * than once in the native module's lifecycle and we are already
           * preventing that it gets called more than once in the JS lifecycle
           * so we can't do anything more about it here.
           * https://github.com/doomsower/react-native-startup-time/blob/1b7517958918406450300dd6bca7c483e6814cfe/android/src/main/java/com/github/doomsower/RNStartupTimeModule.java#L37
           */
        });
      nativeMethodInvokedOnce = true;
    }
  }, []);
  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
};
