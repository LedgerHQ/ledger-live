// @flow

import { View, StyleSheet } from "react-native";
import React from "react";
import { Trans, useTranslation } from "react-i18next";

import { useTheme } from "@react-navigation/native";
import LiveLogo from "../icons/LiveLogoIcon";
import Spinning from "./Spinning";
import LText from "./LText";
import DeviceActionProgress from "./DeviceActionProgress";
import SkipLock from "./behaviour/SkipLock";

type Props = {
  progress: number,
  installing: string,
};

export default function Installing({ progress, installing }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <SkipLock />
      {progress === 0 ? (
        <View style={{ padding: 10 }}>
          <Spinning>
            <LiveLogo color={colors.grey} size={40} />
          </Spinning>
        </View>
      ) : (
        <DeviceActionProgress progress={progress} size={60} />
      )}
      <LText semiBold style={styles.title}>
        <Trans
          i18nKey="FirmwareUpdate.Installing.title"
          values={{
            stepName: t(`FirmwareUpdate.steps.${installing}`),
          }}
        />
      </LText>
      <LText style={styles.subtitle} color="grey">
        <Trans i18nKey="FirmwareUpdate.Installing.subtitle" />
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 80,
  },
  title: {
    marginTop: 30,
    marginBottom: 20,
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
});
