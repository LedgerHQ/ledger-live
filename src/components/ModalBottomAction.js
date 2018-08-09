/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import LText from "../components/LText";

export default class ModalBottomAction extends Component<{
  icon: *,
  title: *,
  description: *,
  button: *,
}> {
  render() {
    const { icon, title, description, button } = this.props;
    return (
      <View>
        <View style={styles.root}>
          <View style={styles.icon}>{icon}</View>
          <View style={styles.body}>
            {title && (
              <LText bold style={styles.title}>
                {title}
              </LText>
            )}
            <LText style={styles.description}>{description}</LText>
          </View>
          <View style={styles.button}>{button}</View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  icon: {
    marginTop: 15,
  },
  body: {
    flexDirection: "column",
  },
  title: {
    marginTop: 15,
    textAlign: "center",
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    margin: 15,
  },
  button: {
    margin: 25,
    flexDirection: "row",
    flexGrow: 1,
  },
});
