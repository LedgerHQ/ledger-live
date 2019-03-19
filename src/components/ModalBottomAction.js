/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import LText from "./LText";
import colors from "../colors";

const forceInset = { bottom: "always" };

export default class ModalBottomAction extends Component<{
  icon?: *,
  title?: *,
  description?: *,
  footer: *,
}> {
  render() {
    const { icon, title, description, footer } = this.props;
    return (
      <SafeAreaView forceInset={forceInset} style={styles.root}>
        {icon && <View style={styles.icon}>{icon}</View>}
        {title ? (
          <LText semiBold style={styles.title}>
            {title}
          </LText>
        ) : null}
        <View style={styles.body}>
          {description && (
            <LText style={styles.description}>{description}</LText>
          )}
          <View style={styles.footer}>{footer}</View>
        </View>
      </SafeAreaView>
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
    color: colors.grey,
  },
  footer: {},
});
