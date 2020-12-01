// @flow

import React, { useRef } from "react";
import { ScrollView } from "react-native";
import { useScrollToTop } from "../navigation/utils";

export default function NavigationScrollView({
  children,
  ...scrollViewProps
}: any) {
  const ref = useRef();
  useScrollToTop(ref);

  return (
    <ScrollView ref={ref} {...scrollViewProps}>
      {children}
    </ScrollView>
  );
}
