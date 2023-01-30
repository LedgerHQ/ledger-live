import React from "react";
import { getTimeSinceStartup } from "react-native-startup-time";
import { StyleSheet, View } from "react-native";

export let appStartupTime: number;
export let appFirstRenderTime: number;

export const StartupTimeMarker = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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
    <>
      <View style={styles.invisible} onLayout={onLayout} />
      {children}
    </>
  );
};

const styles = StyleSheet.create({
  invisible: {
    width: 0,
    height: 0,
  },
});
