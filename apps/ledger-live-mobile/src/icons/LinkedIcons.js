/* @flow */

import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { rgba } from "../colors";

type Props = {
  left: React$Node,
  right: React$Node,
  center: React$Node,
  color?: string,
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    paddingTop: 16,
  },
  smallDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    margin: 4,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 24,
    margin: 4,
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
});

const LinkedIcons = ({ left, right, center, color: c }: Props) => {
  const { colors } = useTheme();
  const color = c || colors.live;
  return (
    <View style={styles.header}>
      {left}
      <View style={[styles.smallDot, { backgroundColor: rgba(color, 0.1) }]} />
      <View style={[styles.smallDot, { backgroundColor: rgba(color, 0.2) }]} />
      <View style={[styles.smallDot, { backgroundColor: rgba(color, 0.3) }]} />
      <View style={[styles.dot, { backgroundColor: rgba(color, 0.3) }]}>
        {center}
      </View>
      <View style={[styles.smallDot, { backgroundColor: rgba(color, 0.8) }]} />
      <View style={[styles.smallDot, { backgroundColor: rgba(color, 0.9) }]} />
      <View style={[styles.smallDot, { backgroundColor: color }]} />
      {right}
    </View>
  );
};
export default LinkedIcons;
