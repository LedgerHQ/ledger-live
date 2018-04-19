/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import GenericButton from "./GenericButton";

export default class RedButton extends Component<*> {
  render() {
    return (
      <GenericButton
        {...this.props}
        titleStyle={[styles.title, this.props.titleStyle]}
        containerStyle={[styles.container, this.props.containerStyle]}
      />
    );
  }
}
const styles = StyleSheet.create({
  title: {
    color: "#f00"
  },
  container: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f00"
  }
});
