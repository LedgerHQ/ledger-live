/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { ApplicationVersion } from "../../types/manager";
import LText from "../../components/LText";
import Button from "../../components/Button";

class AppRow extends PureComponent<{
  app: ApplicationVersion,
  onInstall: ApplicationVersion => Promise<void>,
  onUninstall: ApplicationVersion => Promise<void>,
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
        <LText>{app.name}</LText>
        <Button type="primary" onPress={this.onInstall} title="install" />
        <Button type="secondary" onPress={this.onUninstall} title="uninstall" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 8,
    height: 70,
    backgroundColor: "white",
    borderRadius: 4,
  },
});

export default AppRow;
