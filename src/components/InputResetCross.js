// @flow
import React from "react";
import { View, StyleSheet } from "react-native";

import Touchable from "./Touchable";
import Close from "../icons/Close";
import colors from "../colors";

type Props = {
  onPress: () => void,
  style?: *,
};

const InputResetCross = ({ onPress, style }: Props) => (
  <Touchable event="ResetInput" onPress={onPress} style={style}>
    <View style={styles.container}>
      <Close color={colors.white} size={12} />
    </View>
  </Touchable>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: 20,
    height: 20,
    borderRadius: 50,
    backgroundColor: colors.fog,
    marginLeft: 8,
  },
});

export default InputResetCross;
