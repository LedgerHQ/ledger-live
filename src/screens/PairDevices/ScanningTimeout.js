// @flow

import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import { translate } from "react-i18next";
import BluetoothScanning from "../../components/BluetoothScanning";
import colors from "../../colors";
import Button from "../../components/Button";
import LText from "../../components/LText";

type Props = {
  onRetry: () => void,
  onCancel: () => void,
  t: *,
};

class ScanningTimeout extends Component<Props> {
  render() {
    const { onCancel, onRetry, t } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <BluetoothScanning isError />
          <LText secondary semiBold style={styles.titleText}>
            {t("PairDevices.ScanningTimeout.title")}
          </LText>
          <LText style={styles.SubtitleText}>
            {t("PairDevices.ScanningTimeout.desc")}
          </LText>
        </View>

        <View style={styles.footer}>
          <Button
            type="secondary"
            title={t("common.cancel")}
            onPress={onCancel}
            containerStyle={styles.button}
          />
          <Button
            type="primary"
            title={t("common.retry")}
            onPress={onRetry}
            containerStyle={[styles.button, styles.primaryButton]}
          />
        </View>
      </View>
    );
  }
}

export default translate()(ScanningTimeout);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
  },
  titleText: {
    marginTop: 24,
    color: colors.darkBlue,
    fontSize: 18,
  },
  SubtitleText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    color: colors.grey,
  },
  footer: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
  },
  primaryButton: {
    marginLeft: 10,
  },
});
