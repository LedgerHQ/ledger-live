/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import GenericButton from "./GenericButton";

export default class ReceiveFundsButton extends Component<*> {
  render() {
    return <GenericButton {...this.props} containerStyle={styles.container} />;
  }
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 40,
    margin: 10,
    backgroundColor: "white",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
