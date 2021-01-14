/* @flow */

import React from "react";
import { View, StyleSheet, PixelRatio } from "react-native";
import Icon from "react-native-vector-icons/dist/Ionicons";
import { useTheme } from "@react-navigation/native";

type Props = {
  thin?: boolean,
  lineColor?: string,
  children?: any,
  noMargin?: boolean,
  style?: *,
};

export const ArrowDownCircle = ({
  size = 24,
  big,
}: {
  size?: number,
  big?: boolean,
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.circle,
        { borderColor: colors.lightFog },
        big ? styles.arrowBig : null,
      ]}
    >
      <Icon
        name={"ios-arrow-round-down"}
        size={big ? 32 : size}
        color={colors.live}
      />
    </View>
  );
};

export default function SectionSeparator({
  thin,
  lineColor,
  children,
  style,
  noMargin,
}: Props) {
  const { colors } = useTheme();
  const lineStyle = [
    styles.line,
    { backgroundColor: colors.lightFog },
    thin && styles.thin,
    lineColor && { backgroundColor: lineColor },
  ];
  return (
    <View style={[styles.root, style]}>
      <View style={lineStyle} />
      {children ? (
        <View
          style={noMargin ? null : { ...styles.node, color: colors.lightFog }}
        >
          {children}
        </View>
      ) : null}
      <View style={lineStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  arrowBig: { width: 36, height: 36 },
  circle: {
    borderWidth: 1,
    borderRadius: 100,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  node: {
    marginHorizontal: 11,
  },
  line: {
    height: 4 / PixelRatio.get(),
    flexGrow: 1,
  },
  thin: {
    height: 2 / PixelRatio.get(),
  },
});
