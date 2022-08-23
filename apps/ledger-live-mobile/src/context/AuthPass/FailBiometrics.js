/* @flow */
import React from "react";
import { StyleSheet, View, TouchableWithoutFeedback } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";
import type { Privacy } from "../../reducers/settings";
import BiometricsIcon from "../../components/BiometricsIcon";

type Props = {
  privacy: Privacy,
  lock: () => void,
};

function FailBiometrics({ privacy, lock }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <TouchableWithoutFeedback onPress={lock}>
        <View style={styles.iconStyle}>
          <BiometricsIcon
            biometricsType={privacy.biometricsType}
            failed={true}
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
        <LText style={styles.description} color="grey">
          <Trans i18nKey="auth.failed.biometrics.description" />
        </LText>
      </View>
    </View>
  );
}

export default FailBiometrics;

const styles = StyleSheet.create({
  root: {
    fontSize: 16,
  },
  textContainer: {
    marginTop: 16,
  },
  description: {
    fontSize: 14,
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
