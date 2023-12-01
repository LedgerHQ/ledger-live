import { ScrollListContainer } from "@ledgerhq/native-ui";
import React, { useRef } from "react";
import { ScrollViewProps } from "react-native";
import { useScrollToTop } from "~/navigation/utils";

export default function NavigationScrollView({
  children,
  // Ignored to prevent type conflict
  horizontal,
  ...scrollViewProps
}: ScrollViewProps) {
  const ref = useRef<Parameters<typeof useScrollToTop>[0] & null>(null);
  useScrollToTop(ref);

  return (
    <ScrollListContainer bg="background.main" ref={ref} {...scrollViewProps}>
      {children}
    </ScrollListContainer>
  );
}
