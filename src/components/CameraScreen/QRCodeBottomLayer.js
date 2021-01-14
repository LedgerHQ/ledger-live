// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import { rgba } from "../../colors";

import LText from "../LText";
import QrCodeProgressBar from "./QRCodeProgressBar";
import { softMenuBarHeight } from "../../logic/getWindowDimensions";

type Props = {
  progress?: number,
  viewFinderSize: number,
  liveQrCode?: boolean,
};

function QrCodeBottomLayer({ progress, viewFinderSize, liveQrCode }: Props) {
  return (
    <View
      style={[
        styles.darken,
        { backgroundColor: rgba("#142533", 0.4) },
        styles.centered,
      ]}
    >
      <View style={styles.centered}>
        <LText semiBold style={styles.text}>
          <Trans
            i18nKey={
              liveQrCode
                ? "account.import.scan.descBottom"
                : "send.scan.descBottom"
            }
          />
        </LText>
      </View>
      <QrCodeProgressBar viewFinderSize={viewFinderSize} progress={progress} />
    </View>
  );
}

const styles = StyleSheet.create({
  darken: {
    flexGrow: 1,
    paddingBottom: softMenuBarHeight(),
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
  },
});

export default memo<Props>(QrCodeBottomLayer);
