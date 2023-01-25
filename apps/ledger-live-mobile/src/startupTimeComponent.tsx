import React from "react";
import { View } from "react-native";
import { appFirstRenderTime, reportFirstRender } from "./startupTime";

export const StartupTime = ({ children }: { children: React.ReactNode }) => {
  const [layoutComplete, setLayoutComplete] = React.useState(false);
  const onLayout = React.useCallback(() => {
    if (!layoutComplete) {
      reportFirstRender();
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(
          `Time from startup to first render: ${appFirstRenderTime} ms`,
        );
      }
    }
    setLayoutComplete(true);
  }, [layoutComplete]);
  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
};
