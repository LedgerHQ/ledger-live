import React, { ReactNode, memo } from "react";
import { StyleProp, StyleSheet, TextStyle } from "react-native";
import { Text } from "@ledgerhq/native-ui";

const Words = ({
  children,
  highlighted,
  style,
}: {
  children: ReactNode;
  highlighted?: boolean;
  style?: StyleProp<TextStyle>;
}) => (
  <Text
    numberOfLines={1}
    fontWeight={highlighted ? "bold" : "semiBold"}
    style={[styles.summaryWords, style]}
    color={highlighted ? "primary.c70" : "neutral.c60"}
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
