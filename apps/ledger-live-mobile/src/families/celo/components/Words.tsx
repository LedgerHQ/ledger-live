import React, { ReactNode, memo } from "react";
import { StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";

const Words = ({
  children,
  highlighted,
  style,
}: {
  children: ReactNode;
  highlighted?: boolean;
  style?: any;
}) => (
  <Text
    numberOfLines={1}
    fontWeight={highlighted ? "bold" : "semiBold"}
    style={[styles.summaryWords, style]}
    color={highlighted ? "live" : "smoke"}
  >
    {children}
  </Text>
);

const styles = StyleSheet.create({
  summaryWords: {
    marginRight: 6,
    fontSize: 18,
  },
});

export default memo(Words);
