// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import colors, { rgba } from "../../colors";

import LText from "../LText";
import QrCodeProgressBar from "./QRCodeProgressBar";
import { softMenuBarHeight } from "../../logic/getWindowDimensions";

type Props = {
  progress?: number,
  viewFinderSize: number,
  liveQrCode?: boolean,
};

class QrCodeBottomLayer extends PureComponent<Props> {

  render() {
    const { progress, viewFinderSize, liveQrCode } = this.props;
    return (
      <View style={[styles.darken, styles.centered]}>
        <View style={styles.centered}>
          <LText semibold style={styles.text}>
            <Trans
              i18nKey={
                liveQrCode
                  ? "account.import.scan.descBottom"
                  : "send.scan.descBottom"
              }
            />
          </LText>
        </View>
        <QrCodeProgressBar
          viewFinderSize={viewFinderSize}
          progress={progress}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  darken: {
    backgroundColor: rgba(colors.darkBlue, 0.4),
    flexGrow: 1,
    paddingBottom: softMenuBarHeight(),
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: colors.white,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
  },
});

export default QrCodeBottomLayer;
