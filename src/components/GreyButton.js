/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import GenericButton from "./GenericButton";

export default class GreyButton extends Component<*> {
  render() {
    return (
      <GenericButton
        {...this.props}
        titleStyle={styles.title}
        containerStyle={styles.container}
      />
    );
  }
}
const styles = StyleSheet.create({
  title: {
    color: "#aaa"
  },
  container: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#aaa"
  }
});
