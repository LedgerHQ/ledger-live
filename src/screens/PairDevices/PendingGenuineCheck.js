// @flow

import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Trans } from "react-i18next";
import DeviceNanoAction from "../../components/DeviceNanoAction";

import colors from "../../colors";
import LText from "../../components/LText";

const { width } = Dimensions.get("window");

class PendingGenuineCheck extends PureComponent<*> {
  render() {
    return (
      <Fragment>
        <LText secondary semiBold style={styles.title}>
          <Trans i18nKey="PairDevices.GenuineCheck.title" />
        </LText>
        <LText style={styles.subtitle}>
          <Trans i18nKey="PairDevices.GenuineCheck.title">
            Make sure your Nano X is on Dashboard and accept
            <LText bold style={styles.bold}>
              Allow Manager
            </LText>
          </Trans>
        </LText>

        <View style={styles.footer}>
          <DeviceNanoAction powerAction screen="validation" width={width} />
        </View>
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    marginTop: 16,
    fontSize: 18,
    color: colors.darkBlue,
  },
  subtitleContainer: {},
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  bold: {},
  footer: {
    marginTop: 10,
    paddingBottom: 80,
    paddingLeft: "20%",
  },
});

export default PendingGenuineCheck;
