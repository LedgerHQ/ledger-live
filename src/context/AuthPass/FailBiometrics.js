/* @flow */
import React, { Component } from "react";
import { StyleSheet, View, TouchableWithoutFeedback } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../components/LText";
import type { Privacy } from "../../reducers/settings";
import colors from "../../colors";
import BiometricsIcon from "../../components/BiometricsIcon";

type Props = {
  privacy: Privacy,
  lock: () => void,
};

class FailBiometrics extends Component<Props> {
  render() {
    const { privacy, lock } = this.props;
    return (
      <View>
        <TouchableWithoutFeedback onPress={lock}>
          <View style={styles.iconStyle}>
            <BiometricsIcon
              biometricsType={privacy.biometricsType}
              color={colors.alert}
              size={80}
            />
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.textContainer}>
          <LText semiBold secondary style={styles.title}>
            <Trans
              i18nKey="auth.failed.biometrics.title"
              values={{
                ...privacy,
                biometricsType: privacy.biometricsType,
              }}
            />
          </LText>
          <LText style={styles.description}>
            <Trans i18nKey="auth.failed.biometrics.description" />
          </LText>
        </View>
      </View>
    );
  }
}

export default FailBiometrics;

const styles = StyleSheet.create({
  root: {
    color: colors.darkBlue,
    fontSize: 16,
  },
  textContainer: {
    marginTop: 16,
  },
  description: {
    fontSize: 14,
    color: colors.grey,
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
  },
  iconStyle: {
    alignSelf: "center",
  },
});
