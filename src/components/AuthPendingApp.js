/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, Image } from "react-native";

class AuthPendingApp extends Component<*> {
  render() {
    return (
      <View style={styles.root}>
        <Image source={require("../images/logo_small.png")} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 40,
    marginVertical: 32,
    alignItems: "center",
  },
});

export default AuthPendingApp;
