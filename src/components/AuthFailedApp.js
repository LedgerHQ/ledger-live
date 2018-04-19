/* @flow */
import React, { Component } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { withReboot } from "../context/Reboot";
import LText from "./LText";
import BlueButton from "./BlueButton";
import RedButton from "./RedButton";

class AuthFailedApp extends Component<{
  reboot: (?boolean) => *
}> {
  onRebootSoft = () => this.props.reboot();
  onRebootHard = () => {
    Alert.alert(
      "Are you sure you want to sign out?",
      "All accounts data will be removed from your phone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign me out", onPress: () => this.props.reboot(true) }
      ]
    );
  };
  render() {
    return (
      <View style={styles.root}>
        <LText>Authentication Failed</LText>

        <View style={styles.buttons}>
          <BlueButton
            title="Try Again"
            onPress={this.onRebootSoft}
            containerStyle={styles.button}
          />
          <RedButton
            title="Sign out"
            onPress={this.onRebootHard}
            containerStyle={styles.button}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 40,
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center"
  },
  buttons: {
    flexDirection: "row"
  },
  button: {
    margin: 20
  }
});

export default withReboot(AuthFailedApp);
