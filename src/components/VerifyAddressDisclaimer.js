// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet, Image } from "react-native";
import { translate } from "react-i18next";

import type { T } from "../types/common";
import shield from "../images/shield.png";
import shieldWarning from "../images/shield-warning.png";

import colors from "../colors";

import LText from "./LText";

type Props = {
  t: T,
  accountType: string,
  verified: boolean,
};

class VerifyAddressDisclaimer extends PureComponent<Props> {
  render(): React$Node {
    const { verified, accountType, t } = this.props;
    return (
      <View
        style={[styles.wrapper, !verified ? styles.wrapperWarning : undefined]}
      >
        <Image source={verified ? shield : shieldWarning} />
        <View style={styles.textWrapper}>
          <LText
            style={[styles.text, !verified ? styles.textWarning : undefined]}
          >
            {t("transfer.receive.verifyAddress", { accountType })}
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
    backgroundColor: colors.lightGrey,
    flexDirection: "row",
    alignItems: "center",
  },
  wrapperWarning: {
    borderColor: colors.alert,
    backgroundColor: colors.lightAlert,
  },
  textWrapper: {
    flex: 1,
  },
  text: {
    fontSize: 12,
    color: colors.grey,
    lineHeight: 18,
    paddingLeft: 16,
  },
  textWarning: {
    color: colors.alert,
  },
});

export default translate()(VerifyAddressDisclaimer);
