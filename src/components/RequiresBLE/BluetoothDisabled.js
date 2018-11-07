// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import LText from "../LText";
import BluetoothDisabledImage from "./assets/BluetoothDisabledImage";
import colors from "../../colors";

export default class BluetoothDisabled extends PureComponent<{}> {
  render() {
    // NB based on the state we could have different wording?
    return (
      <View style={styles.container}>
        <BluetoothDisabledImage />
        <View>
          <LText bold secondary style={styles.titleFont}>
            <Trans i18nKey="bluetooth.required" />
          </LText>
        </View>
        <View style={styles.desc}>
          <LText style={styles.descFont}>
            <Trans i18nKey="bluetooth.checkEnabled" />
          </LText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleFont: {
    color: colors.darkBlue,
    fontSize: 18,
    marginTop: 24,
  },
  desc: {
    paddingHorizontal: 20,
  },
  descFont: {
    color: colors.grey,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
