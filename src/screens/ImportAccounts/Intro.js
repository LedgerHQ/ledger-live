/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import LText from "../../components/LText";
import BlueButton from "../../components/BlueButton";

export default class Intro extends Component<{
  onAccept: () => void,
}> {
  render() {
    const { onAccept } = this.props;
    return (
      <View style={styles.body}>
        <LText style={styles.headHelp}>
          Please open Ledger Live desktop application with
          EXPERIMENTAL_TOOLS_SETTINGS=1 and go to{" "}
          <LText bold>
            Settings {">"} Experimental Tools {">"} QRCode Mobile Export
          </LText>
          .
        </LText>
        <BlueButton title="Scan the QR Code" onPress={onAccept} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  headHelp: {
    marginBottom: 20,
  },
});
