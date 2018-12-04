/* @flow */
import React, { Component } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { translate } from "react-i18next";

import type { T } from "../../types/common";
import { withReboot } from "../../context/Reboot";
import SettingsRow from "../../components/SettingsRow";

class SignOut extends Component<{ reboot: (?boolean) => *, t: T }> {
  onResetAll = async () => {
    const { reboot } = this.props;
    await reboot(true);
  };

  onSignOut = () => {
    const { t } = this.props;
    Alert.alert(t("signout.confirm"), t("signout.disclaimer"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("signout.action"), onPress: this.onResetAll },
    ]);
  };

  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <SettingsRow event="SignOutRow" onPress={this.onSignOut} center>
          <Text style={styles.signOutText}>{t("common.common.signOut")}</Text>
        </SettingsRow>
      </View>
    );
  }
}

export default translate()(withReboot(SignOut));

const styles = StyleSheet.create({
  root: {
    marginVertical: 40,
  },
  signOutText: {
    color: "#c00",
  },
});
