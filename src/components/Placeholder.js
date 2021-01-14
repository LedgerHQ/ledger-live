// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

type Props = {
  width?: number,
  containerHeight?: number,
  style?: *,
};

function Placeholder({ width, containerHeight, style }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.root,
        containerHeight ? { height: containerHeight } : null,
      ]}
    >
      <View
        style={[
          styles.inner,
          { width: width || 100, backgroundColor: colors.fog },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    justifyContent: "center",
  },
  inner: {
    height: 8,
    borderRadius: 4,
  },
});

export default memo<Props>(Placeholder);
