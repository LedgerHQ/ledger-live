/* @flow */
import React, { Component } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableWithoutFeedback
} from "react-native";
import colors from "../colors";

export default class ScreenGeneric extends Component<{
  renderHeader: (props: *) => *,
  children: *,
  onPressHeader?: () => void
}> {
  render() {
    const { children, renderHeader, onPressHeader } = this.props;
    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onPressHeader}>
          <View style={styles.header}>{renderHeader(this.props)}</View>
        </TouchableWithoutFeedback>
        <View style={styles.body}>{children}</View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    height: 70,
    paddingTop: 20,
    backgroundColor: colors.blue
  },
  body: {
    flex: 1,
    position: "relative"
  }
});
