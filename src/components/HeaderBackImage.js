/* @flow */
import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import ArrowLeft from "../images/icons/ArrowLeft";
import colors from "../colors";

const HeaderBackImage = () => (
  <View style={styles.root}>
    <ArrowLeft size={16} color={colors.darkBlue} />
  </View>
);

export default HeaderBackImage;

const styles = StyleSheet.create({
  root: {
    paddingLeft: Platform.OS === "ios" ? 16 : 3,
  },
});
