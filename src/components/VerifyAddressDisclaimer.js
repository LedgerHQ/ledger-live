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
  unsafe: boolean,
};

class VerifyAddressDisclaimer extends PureComponent<Props> {
  render(): React$Node {
    const { verified, unsafe, accountType, t } = this.props;

    return (
      <View
        style={[styles.wrapper, unsafe ? styles.wrapperWarning : undefined]}
      >
        <Image source={unsafe ? shieldWarning : shield} />
        <View style={styles.textWrapper}>
          <LText style={[styles.text, unsafe ? styles.textWarning : undefined]}>
            {unsafe
              ? t("transfer.receive.verifySkipped", { accountType })
              : verified
                ? t("transfer.receive.verified")
                : t("transfer.receive.verifyPending", { accountType })}
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
