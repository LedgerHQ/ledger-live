import React, { Component } from "react";
import { View, StyleSheet, Image } from "react-native";
import Touchable from "./Touchable";
import LText from "./LText";

const flowPush = <View style={{ flex: 1 }} />;

export default class SettingsRow extends Component<{
  onPress: () => void,
  title: string,
  arrowRight?: boolean,
  center?: boolean,
  children: *
}> {
  render() {
    const { onPress, children, title, arrowRight, center } = this.props;
    return (
      <Touchable
        onPress={onPress}
        style={[styles.root, center && styles.center]}
      >
        <LText>{title}</LText>
        {!center ? flowPush : null}
        {children}
        {arrowRight ? (
          <Image source={require("../images/arrow_right.png")} />
        ) : null}
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    marginBottom: 1
  },
  center: {
    justifyContent: "center"
  }
});
