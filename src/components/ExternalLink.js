// @flow
import React from "react";
import { StyleSheet } from "react-native";
import LText from "./LText";
import Touchable from "./Touchable";
import ExternalLink from "../icons/ExternalLink";
import colors from "../colors";

type Props = {
  text: React$Node,
  onPress: () => void | Promise<void>,
  event: string,
  eventProperties?: Object,
  iconFirst?: boolean,
  ltextProps?: *,
};

const Link = ({ text, onPress, event, eventProperties, ltextProps }: Props) => (
  <Touchable
    event={event}
    eventProperties={eventProperties}
    onPress={onPress}
    style={styles.root}
  >
    <LText bold style={styles.text} {...ltextProps}>
      {text}
    </LText>
    <ExternalLink size={14} color={colors.live} />
  </Touchable>
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
