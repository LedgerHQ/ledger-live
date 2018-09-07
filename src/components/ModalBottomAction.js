/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import LText from "../components/LText";
import colors from "../colors";

export default class ModalBottomAction extends Component<{
  icon: *,
  title: *,
  description: *,
  footer: *,
}> {
  render() {
    const { icon, title, description, footer } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.icon}>{icon}</View>
        <View style={styles.body}>
          {title && (
            <LText bold style={styles.title}>
              {title}
            </LText>
          )}
          <LText style={styles.description}>{description}</LText>
          <View style={styles.footer}>{footer}</View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  icon: {
    margin: 24,
  },
  body: {
    flexDirection: "column",
    marginHorizontal: 16,
  },
  title: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    color: colors.grey,
  },
  footer: {
    paddingBottom: 16,
  },
});
