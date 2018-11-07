// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import colors, { rgba } from "../../colors";

type Props = {
  viewFinderSize: number,
};

class QRCodeReactangleViewport extends PureComponent<Props> {
  render() {
    const { viewFinderSize } = this.props;
    return (
      <View style={styles.row}>
        <View style={styles.darken} />
        <View style={{ width: viewFinderSize, height: viewFinderSize }}>
          <View style={styles.innerRow}>
            <View
              style={[styles.border, styles.borderLeft, styles.borderTop]}
            />
            <View style={styles.border} />
            <View
              style={[styles.border, styles.borderRight, styles.borderTop]}
            />
          </View>
          <View style={styles.innerRow} />
          <View style={styles.innerRow}>
            <View
              style={[styles.border, styles.borderLeft, styles.borderBottom]}
            />
            <View style={styles.border} />
            <View
              style={[styles.border, styles.borderRight, styles.borderBottom]}
            />
          </View>
        </View>
        <View style={styles.darken} />
      </View>
    );
  }
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
    backgroundColor: rgba(colors.darkBlue, 0.4),
    flexGrow: 1,
  },
  border: {
    borderColor: "white",
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

export default QRCodeReactangleViewport;
