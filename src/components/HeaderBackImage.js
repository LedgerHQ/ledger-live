/* @flow */
import React, { PureComponent } from "react";
import { View, Platform, StyleSheet } from "react-native";
import ArrowLeft from "../icons/ArrowLeft";
import colors from "../colors";

class HeaderBackImage extends PureComponent<*> {
  render() {
    return (
      <View style={styles.root}>
        <ArrowLeft size={16} color={colors.grey} />
      </View>
    );
  }
}

export default HeaderBackImage;

const styles = StyleSheet.create({
  root: {
    marginLeft: Platform.OS === "ios" ? 0 : -13,
    padding: 16,
  },
});
