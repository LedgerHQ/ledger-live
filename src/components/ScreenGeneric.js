/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";
import colors from "../colors";

export default class ScreenGeneric<T> extends Component<{
  Header: React$ComponentType<$Shape<T>>,
  children: *,
  onPressHeader?: () => void,
  extraData?: T,
}> {
  render() {
    const { children, Header, onPressHeader, extraData } = this.props;
    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onPressHeader}>
          <View style={styles.header}>
            <Header {...extraData} />
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.body}>{children}</View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 70,
    paddingTop: 20,
    backgroundColor: colors.blue,
  },
  body: {
    flex: 1,
    position: "relative",
  },
});
