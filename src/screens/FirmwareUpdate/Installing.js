// @flow

import { View, StyleSheet } from "react-native";
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";

import colors from "../../colors";
import LiveLogo from "../../icons/LiveLogoIcon";
import Spinning from "../../components/Spinning";
import LText from "../../components/LText";

class Installing extends PureComponent<*> {
  render() {
    const { children } = this.props;
    return (
      <View style={styles.root}>
        <Spinning>
          <LiveLogo color={colors.fog} size={40} />
        </Spinning>
        <LText semiBold style={styles.title}>
          <Trans i18nKey="FirmwareUpdate.Installing.title" />
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

export default Installing;
