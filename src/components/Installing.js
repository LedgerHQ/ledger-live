// @flow

import { View, StyleSheet } from "react-native";
import React, { PureComponent } from "react";
import { Trans, translate } from "react-i18next";

import colors from "../colors";
import LiveLogo from "../icons/LiveLogoIcon";
import Spinning from "./Spinning";
import LText from "./LText";
import FirmwareProgress from "./FirmwareProgress";

class Installing extends PureComponent<{
  progress: number,
  installing: string,
  t: *,
}> {
  render() {
    const { progress, installing, t } = this.props;
    return (
      <View style={styles.root}>
        {progress === 0 ? (
          <View style={{ padding: 10 }}>
            <Spinning>
              <LiveLogo color={colors.fog} size={40} />
            </Spinning>
          </View>
        ) : (
          <FirmwareProgress progress={progress} size={60} />
        )}
        <LText semiBold style={styles.title}>
          <Trans
            i18nKey="FirmwareUpdate.Installing.title"
            values={{
              stepName: t(`FirmwareUpdate.steps.${installing}`),
            }}
          />
        </LText>
        <LText style={styles.subtitle}>
          <Trans i18nKey="FirmwareUpdate.Installing.subtitle" />
        </LText>
      </View>
    );
  }
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
    color: colors.darkBlue,
    marginTop: 30,
    marginBottom: 20,
    fontSize: 18,
  },
  subtitle: {
    color: colors.grey,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
});

export default translate()(Installing);
