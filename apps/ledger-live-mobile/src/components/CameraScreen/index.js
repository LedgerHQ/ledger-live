/* @flow */
import React from "react";
import liveCommonPkg from "@ledgerhq/live-common/package.json";
import { StyleSheet, View } from "react-native";

import { rgba } from "../../colors";
import QRCodeTopLayer from "./QRCodeTopLayer";
import QRCodeBottomLayer from "./QRCodeBottomLayer";
import QRCodeRectangleViewport from "./QRCodeRectangleViewport";
import LText from "../LText";

type Props = {
  width: number,
  height: number,
  progress?: number,
  liveQrCode?: boolean,
};

export default function CameraScreen({
  width,
  height,
  progress,
  liveQrCode,
}: Props) {
  // Make the viewfinder borders 2/3 of the screen shortest border
  const viewFinderSize = (width > height ? height : width) * (2 / 3);
  const wrapperStyle =
    width > height ? { height, alignSelf: "stretch" } : { width, flexGrow: 1 };

  return (
    <View style={wrapperStyle}>
      <View
        style={[
          styles.darken,
          { backgroundColor: rgba("#142533", 0.4) },
          styles.centered,
          styles.topCell,
        ]}
      >
        {typeof progress === "number" ? <QRCodeTopLayer /> : null}
      </View>
      <QRCodeRectangleViewport viewFinderSize={viewFinderSize} />
      <QRCodeBottomLayer
        viewFinderSize={viewFinderSize}
        progress={progress}
        liveQrCode={liveQrCode}
      />
      <LText style={styles.version}>{liveCommonPkg.version}</LText>
    </View>
  );
}

const styles = StyleSheet.create({
  darken: {
    flexGrow: 1,
  },
  border: {
    borderColor: "white",
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topCell: {
    paddingTop: 64,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  version: {
    fontSize: 10,
    position: "absolute",
    bottom: 10,
    right: 10,
    opacity: 0.4,
    color: "#fff",
  },
});
