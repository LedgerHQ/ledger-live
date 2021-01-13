// @flow
import React from "react";
import { StyleSheet } from "react-native";
import LText from "./LText";
import Touchable from "./Touchable";
import ExternalLink from "../icons/ExternalLink";

type Props = {
  text: React$Node,
  onPress?: () => void | Promise<void>,
  event: string,
  eventProperties?: Object,
  iconFirst?: boolean,
  ltextProps?: *,
  color?: string,
};

const Link = ({
  text,
  onPress,
  event,
  eventProperties,
  ltextProps,
  color = "live",
}: Props) => (
  <Touchable
    event={event}
    eventProperties={eventProperties}
    onPress={onPress}
    style={styles.root}
  >
    <LText semiBold style={[styles.text]} color={color} {...ltextProps}>
      {text}
    </LText>
    <ExternalLink size={14} color={color} />
  </Touchable>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    paddingRight: 8,
  },
});

export default Link;
