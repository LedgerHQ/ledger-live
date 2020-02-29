import React from "react";
import { StyleSheet, View } from "react-native";
import colors from "../colors";

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: colors.live,
    width: 15,
    height: 15,
    borderRadius: 15,
    borderColor: colors.white,
    borderWidth: 3,
  },
});

export default () => <View style={styles.root} />;
