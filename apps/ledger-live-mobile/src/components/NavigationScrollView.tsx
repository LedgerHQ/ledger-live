import { ScrollListContainer } from "@ledgerhq/native-ui";
import React, { useRef } from "react";
import { ScrollViewProps } from "react-native";
import { useScrollToTop } from "../navigation/utils";

export default function NavigationScrollView({
  children,
  ...scrollViewProps
}: ScrollViewProps) {
  const ref = useRef();
  useScrollToTop(ref);

  return (
    <ScrollListContainer bg="background.main" ref={ref} {...scrollViewProps}>
      {children}
    </ScrollListContainer>
  );
}
