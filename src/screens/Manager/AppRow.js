/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import type { ApplicationVersion } from "../../types/manager";
import LText from "../../components/LText";
import Button from "../../components/Button";

import colors from "../../colors";

import AppIcon from "./AppIcon";
import Trash from "../../icons/Trash";
import Import from "../../icons/Import";

class AppRow extends PureComponent<{
  app: ApplicationVersion,
  onInstall: ApplicationVersion => *,
  onUninstall: ApplicationVersion => *,
}> {
  onInstall = () => {
    const { app, onInstall } = this.props;
    return onInstall(app);
  };

  onUninstall = () => {
    const { app, onUninstall } = this.props;
    return onUninstall(app);
  };

  render() {
    const { app } = this.props;
    return (
      <View style={styles.root}>
        <AppIcon icon={app.icon} />
        <View style={styles.meta}>
          <LText secondary semiBold style={styles.name}>
            {app.name}
          </LText>
          <LText style={styles.version}>{app.version}</LText>
        </View>
        <Button
          type="tertiary"
          onPress={this.onInstall}
          containerStyle={[styles.button, styles.btnSpace]}
          IconLeft={Import}
          iconColor={colors.live}
        />
        <Button
          type="secondary"
          onPress={this.onUninstall}
          containerStyle={styles.button}
          IconLeft={Trash}
          iconColor={colors.darkBlue}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 16,
    height: 70,
    borderRadius: 4,
    backgroundColor: "white",
  },
  meta: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 16,
  },
  name: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  version: {
    fontSize: 14,
    color: colors.grey,
  },
  button: {
    width: 38,
    height: 38,
  },
  btnSpace: {
    marginRight: 16,
  },
});

export default AppRow;
