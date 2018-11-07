// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";

import type { T } from "../../types/common";

import colors from "../../colors";

import LText from "../../components/LText";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import VerifyAddressDisclaimer from "../../components/VerifyAddressDisclaimer";

type Props = {
  t: T,
  action: () => void,
};

class ValidateOnDevice extends PureComponent<Props> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <View style={styles.innerContainer}>
            <View style={styles.picture}>
              <DeviceNanoAction powerAction screen="validation" />
            </View>
            <View style={styles.titleContainer}>
              <LText secondary semiBold style={styles.title}>
                {t("send.validation.title")}
              </LText>
            </View>
            <View style={styles.messageContainer}>
              <LText style={styles.message}>
                {t("send.validation.message")}
              </LText>
            </View>
          </View>
        </View>
        <VerifyAddressDisclaimer text={t("send.validation.disclaimer")} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  picture: {
    marginBottom: 48,
  },
  titleContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    paddingHorizontal: 16,
    color: colors.darkBlue,
    textAlign: "center",
  },
  messageContainer: {
    marginHorizontal: 16,
  },
  message: {
    fontSize: 14,
    paddingHorizontal: 16,
    color: colors.smoke,
    textAlign: "center",
  },
});

export default translate()(ValidateOnDevice);
