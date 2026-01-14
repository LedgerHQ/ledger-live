import React from "react";
import { View } from "react-native";

const ReanimatedSwipeable = React.forwardRef(({ children, renderRightActions, ...props }, ref) => {
  return (
    <View ref={ref} {...props}>
      {children}
    </View>
  );
});

ReanimatedSwipeable.displayName = "ReanimatedSwipeable";

export default ReanimatedSwipeable;
