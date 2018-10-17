/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";

import colors, { rgba } from "../../colors";
import QRCodeTopLayer from "./QRCodeTopLayer";
import QRCodeBottomLayer from "./QRCodeBottomLayer";
import QRCodeRectangleViewport from "./QRCodeRectangleViewport";

type Props = {
  width: number,
  height: number,
  progress?: number,
};

class CameraScreen extends PureComponent<Props> {
  render() {
    const { width, height, progress } = this.props;

    // Make the viewfinder borders 2/3 of the screen shortest border
    const viewFinderSize = (width > height ? height : width) * (2 / 3);
    const wrapperStyle =
      width > height
        ? { height, alignSelf: "stretch" }
        : { width, flexGrow: 1 };

    return (
      <View style={wrapperStyle}>
        <View style={[styles.darken, styles.centered, styles.topCell]}>
          {typeof progress === "number" ? <QRCodeTopLayer /> : null}
        </View>
        <QRCodeRectangleViewport viewFinderSize={viewFinderSize} />
        <QRCodeBottomLayer
          viewFinderSize={viewFinderSize}
          progress={progress}
        />
      </View>
    );
  }
}

export default CameraScreen;

const styles = StyleSheet.create({
  camera: {
    alignItems: "center",
    justifyContent: "center",
  },
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
  text: {
    fontSize: 16,
    lineHeight: 32,
    textAlign: "center",
    color: colors.white,
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topCell: {
    paddingTop: 64,
  },
  progressText: {
    color: colors.white,
    fontSize: 16,
  },
});
