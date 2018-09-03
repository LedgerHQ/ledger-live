// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet, Image } from "react-native";

import shield from "../images/shield.png";
import shieldWarning from "../images/shield-warning.png";

import colors from "../colors";

import LText from "./LText";

type Props = {
  accountType: string,
  verified: boolean,
};

class VerifyAddressDisclaimer extends PureComponent<Props> {
  render(): React$Node {
    const { verified, accountType } = this.props;
    return (
      <View
        style={[styles.wrapper, !verified ? styles.wrapperWarning : undefined]}
      >
        <View style={styles.iconWrapper}>
          <Image source={verified ? shield : shieldWarning} />
        </View>
        <View style={styles.textWrapper}>
          <LText
            style={[styles.text, !verified ? styles.textWarning : undefined]}
          >
            Your receive address has not been confirmed on your Ledger device.
            Please verify your {accountType} address for optimal security.
          </LText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "dashed",
    backgroundColor: colors.lightGrey,
    flexDirection: "row",
    alignItems: "center",
  },
  wrapperWarning: {
    borderColor: colors.alert,
    backgroundColor: colors.lightAlert,
  },
  iconWrapper: {
    flex: 1,
    alignItems: "center",
    paddingRight: 16,
  },
  textWrapper: {
    flex: 3,
  },
  text: {
    fontSize: 12,
    color: colors.grey,
    lineHeight: 18,
  },
  textWarning: {
    color: colors.alert,
  },
});

export default VerifyAddressDisclaimer;
