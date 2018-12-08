// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import colors from "../../colors";

import LText from "../../components/LText";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import VerifyAddressDisclaimer from "../../components/VerifyAddressDisclaimer";
import { deviceNames } from "../../wording";

type Props = {
  action: () => void,
};

class ValidateOnDevice extends PureComponent<Props> {
  render() {
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <View style={styles.innerContainer}>
            <View style={styles.picture}>
              <DeviceNanoAction powerAction screen="validation" />
            </View>
            <View style={styles.titleContainer}>
              <LText secondary semiBold style={styles.title}>
                <Trans
                  i18nKey="send.validation.title"
                  values={deviceNames.nanoX}
                />
              </LText>
            </View>
            <View style={styles.messageContainer}>
              <LText style={styles.message}>
                <Trans i18nKey="send.validation.message" />
              </LText>
            </View>
          </View>
        </View>
        <VerifyAddressDisclaimer
          text={<Trans i18nKey="send.validation.disclaimer" />}
        />
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

export default ValidateOnDevice;
