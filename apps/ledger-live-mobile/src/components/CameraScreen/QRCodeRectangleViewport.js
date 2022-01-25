// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import { rgba } from "../../colors";

type Props = {
  viewFinderSize: number,
};

function QRCodeReactangleViewport({ viewFinderSize }: Props) {
  const borderStyle = { ...styles.border, borderColor: "white" };
  return (
    <View style={styles.row}>
      <View
        style={[styles.darken, { backgroundColor: rgba("#142533", 0.4) }]}
      />
      <View style={{ width: viewFinderSize, height: viewFinderSize }}>
        <View style={styles.innerRow}>
          <View style={[borderStyle, styles.borderLeft, styles.borderTop]} />
          <View style={borderStyle} />
          <View style={[borderStyle, styles.borderRight, styles.borderTop]} />
        </View>
        <View style={styles.innerRow} />
        <View style={styles.innerRow}>
          <View style={[borderStyle, styles.borderLeft, styles.borderBottom]} />
          <View style={borderStyle} />
          <View
            style={[borderStyle, styles.borderRight, styles.borderBottom]}
          />
        </View>
      </View>
      <View
        style={[styles.darken, { backgroundColor: rgba("#142533", 0.4) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "stretch",
    flexGrow: 1,
  },
  darken: {
    flexGrow: 1,
  },
  border: {
    flexGrow: 1,
  },
  borderTop: {
    borderTopWidth: 6,
  },
  borderBottom: {
    borderBottomWidth: 6,
  },
  borderLeft: {
    borderLeftWidth: 6,
  },
  borderRight: {
    borderRightWidth: 6,
  },
});

export default memo<Props>(QRCodeReactangleViewport);
