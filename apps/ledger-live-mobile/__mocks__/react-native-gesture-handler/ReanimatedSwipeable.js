import React from "react";
import { View } from "react-native";

const ReanimatedSwipeable = ({ children, renderRightActions, ...props }) => {
  return <View {...props}>{children}</View>;
};

export default ReanimatedSwipeable;
