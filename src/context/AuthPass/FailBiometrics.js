/* @flow */
import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../components/LText";
import type { Privacy } from "../../reducers/settings";
import colors from "../../colors";
import TouchID from "../../icons/TouchID";
import FaceID from "../../icons/FaceID";
import Fingerprint from "../../icons/Fingerprint";

type Props = {
  privacy: Privacy,
};

class FailBiometrics extends Component<Props> {
  iconSwitch = () => {
    const { privacy } = this.props;
    switch (privacy.biometricsType) {
      case "TouchID":
        return <TouchID color={colors.alert} size={80} />;
      case "FaceID":
        return <FaceID color={colors.alert} size={80} />;
      case "Fingerprint":
        return <Fingerprint color={colors.alert} size={80} />;
      default:
        return null;
    }
  };

  render() {
    const { privacy } = this.props;
    return (
      <View>
        <View style={styles.iconStyle}>{this.iconSwitch()}</View>
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
    marginVertical: 16,
  },
  description: {
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
