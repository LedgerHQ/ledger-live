/* @flow */
import React, { Component } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { withReboot } from "../../context/Reboot";
import SettingsRow from "../../components/SettingsRow";

class SignOut extends Component<{ reboot: (?boolean) => * }> {
  onResetAll = async () => {
    await this.props.reboot(true);
  };
  onSignOut = () => {
    Alert.alert(
      "Are you sure you want to sign out?",
      "All accounts data will be removed from your phone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign me out", onPress: this.onResetAll }
      ]
    );
  };
  render() {
    return (
      <View style={styles.root}>
        <SettingsRow onPress={this.onSignOut} center>
          <Text style={styles.signOutText}>Sign Out</Text>
        </SettingsRow>
      </View>
    );
  }
}

export default withReboot(SignOut);

const styles = StyleSheet.create({
  root: {
    marginVertical: 40
  },
  signOutText: {
    color: "#c00"
  }
});
