import React from "react";
import Animated from "react-native-reanimated";

export function ProgressIndicator(props: React.ComponentProps<typeof Animated.View>) {
  return <Animated.View {...props} />;
}

export type ProgressIndicatorElement = React.ReactElement<
  React.ComponentPropsWithoutRef<typeof ProgressIndicator>,
  typeof ProgressIndicator
>;
