// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";

import type { T } from "../../types/common";
import colors, { rgba } from "../../colors";

import LText from "../LText";
import QrCodeProgressBar from "./QRCodeProgressBar";

type Props = {
  t: T,
  progress?: number,
  viewFinderSize: number,
};

class QrCodeBottomLayer extends PureComponent<Props> {
  render() {
    const { progress, t, viewFinderSize } = this.props;
    return (
      <View style={[styles.darken, styles.centered]}>
        <View style={styles.centered}>
          <LText semibold style={styles.text}>
            {t("account.import.scan.descBottom")}
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
  },
  text: {
    fontSize: 16,
    lineHeight: 32,
    textAlign: "center",
    color: colors.white,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default translate()(QrCodeBottomLayer);
