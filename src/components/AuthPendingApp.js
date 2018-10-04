/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import colors from "../colors";
import LedgerLiveLogo from "./LedgerLiveLogo";
import LiveLogo from "../icons/LiveLogo";

class AuthPendingApp extends Component<*> {
  render() {
    return (
      <View style={styles.root}>
        <LedgerLiveLogo
          width={62}
          height={62}
          icon={<LiveLogo size={42} color={colors.live} />}
        />
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
