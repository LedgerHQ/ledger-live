import React from "react";
import { StyleSheet, View } from "react-native";

type Props = Readonly<{
  testID: string;
  backgroundColor: string;
  height: number;
}>;

export function SectionPlaceholder({ testID, backgroundColor, height }: Props) {
  return <View testID={testID} style={[styles.placeholder, { backgroundColor, height }]} />;
}

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: 12,
  },
});
