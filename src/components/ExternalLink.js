// @flow
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import LText from "./LText";
import ExternalLink from "../icons/ExternalLink";
import colors from "../colors";

type Props = {
  text: React$Node,
  onPress: () => void,
};

const Link = ({ text, onPress }: Props) => (
  <TouchableOpacity onPress={onPress} style={styles.root}>
    <LText bold style={styles.text}>
      {text}
    </LText>
    <ExternalLink size={14} color={colors.live} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    color: colors.live,
    paddingRight: 8,
  },
});

export default Link;
