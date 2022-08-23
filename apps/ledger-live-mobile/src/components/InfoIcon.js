// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Circle from "./Circle";

type Props = {
  children: React$Node,
  bg: string,
  floatingIcon?: React$Node,
  floatingBg?: string,
  size?: number,
};

function BluetoothDisabledIcon({
  children,
  bg,
  floatingIcon,
  floatingBg,
  size = 80,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Circle bg={bg} size={size}>
        {children}
      </Circle>
      {!!floatingIcon && floatingBg ? (
        <View style={[styles.floating, { borderColor: colors.white }]}>
          <Circle bg={floatingBg} size={30}>
            {floatingIcon}
          </Circle>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
  floating: {
    borderWidth: 4,
    borderRadius: 50,
    position: "absolute",
    right: -10,
    top: -10,
  },
});

export default memo<Props>(BluetoothDisabledIcon);
