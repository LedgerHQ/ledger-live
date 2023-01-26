import React from "react";
import { getTimeSinceStartup } from "react-native-startup-time";
import { View } from "react-native";

export let appStartupTime: number;
export let appFirstRenderTime: number;

// getTimeSinceStartup().then(time => {
//   appStartupTime = time;
//   if (__DEV__) {
//     // eslint-disable-next-line no-console
//     console.log(`Time since startup: ${time} ms`);
//   }
// });

export const StartupTime = ({ children }: { children: React.ReactNode }) => {
  const [layoutComplete, setLayoutComplete] = React.useState(false);
  const onLayout = React.useCallback(() => {
    if (!layoutComplete) {
      getTimeSinceStartup().then(time => {
        appStartupTime = time;
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(`Time since startup: ${time} ms`);
        }
      });
      setLayoutComplete(true);
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(
          `Time from startup to first render: ${appFirstRenderTime} ms`,
        );
      }
    }
  }, [layoutComplete]);
  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
};
