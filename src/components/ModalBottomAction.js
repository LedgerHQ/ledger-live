/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import LText from "./LText";

export default class ModalBottomAction extends Component<{
  icon?: *,
  title?: *,
  description?: *,
  footer: *,
}> {
  render() {
    const { icon, title, description, footer } = this.props;
    return (
      <View style={styles.root}>
        {icon && <View style={styles.icon}>{icon}</View>}
        {title ? (
          <LText semiBold style={styles.title}>
            {title}
          </LText>
        ) : null}
        <View style={styles.body}>
          {description && (
            <LText style={styles.description} color="grey">
              {description}
            </LText>
          )}
          <View style={styles.footer}>{footer}</View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  icon: {
    margin: 24,
  },
  body: {
    flexDirection: "column",
    alignSelf: "stretch",
    marginHorizontal: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 24,
  },
  footer: {},
});
