// @flow
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";

import Close from "../icons/Close";
import colors from "../colors";

type Props = {
  onPress: () => void,
  style?: *,
};

const InputResetCross = ({ onPress, style }: Props) => (
  <TouchableOpacity onPress={onPress} style={style}>
    <View style={styles.container}>
      <Close color={colors.white} size={14} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: colors.fog,
  },
});

export default InputResetCross;
