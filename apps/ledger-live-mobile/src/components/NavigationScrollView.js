// @flow

import React, { useRef } from "react";
import { ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useScrollToTop } from "../navigation/utils";

export default function NavigationScrollView({
  children,
  style,
  ...scrollViewProps
}: any) {
  const ref = useRef();
  useScrollToTop(ref);
  const { colors } = useTheme();

  return (
    <ScrollView
      ref={ref}
      {...scrollViewProps}
      style={[{ backgroundColor: colors.background }, style]}
    >
      {children}
    </ScrollView>
  );
}
