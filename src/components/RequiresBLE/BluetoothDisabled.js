// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
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
            Bluetooth required
          </LText>
        </View>
        <View>
          <LText style={styles.descFont}>
            It seems bluetooth is disabled on your mobile. Go to settings and
            enable bluetooth to pair a Nano X
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
  descFont: {
    color: colors.grey,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
