/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import LText from "./LText";

class AuthPendingApp extends Component<{}> {
  render() {
    return (
      <View style={styles.root}>
        <LText>Please Authenticate to access the application</LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 40
  },
  title: {
    fontSize: 18,
    textAlign: "center"
  }
});

export default AuthPendingApp;
