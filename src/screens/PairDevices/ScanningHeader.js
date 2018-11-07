// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import LText from "../../components/LText";
import BluetoothScanning from "../../components/BluetoothScanning";
import colors from "../../colors";

type Props = {
  t: *,
};

class ScanningHeader extends PureComponent<Props> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <BluetoothScanning isAnimated />
        <View style={styles.TitleContainer}>
          <LText secondary semiBold style={styles.TitleText}>
            {t("PairDevices.ScanningHeader.title")}
          </LText>
        </View>
        <View style={styles.SubtitleContainer}>
          <LText style={styles.SubtitleText}>
            {t("PairDevices.ScanningHeader.desc")}
          </LText>
        </View>
      </View>
    );
  }
}

export default translate()(ScanningHeader);

const styles = StyleSheet.create({
  root: {
    paddingVertical: 32,
    alignItems: "center",
  },
  TitleContainer: {
    marginTop: 24,
  },
  TitleText: {
    color: colors.darkBlue,
    fontSize: 18,
  },
  SubtitleContainer: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  SubtitleText: {
    textAlign: "center",
    fontSize: 14,
    color: colors.grey,
  },
});
