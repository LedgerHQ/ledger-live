// @flow
import React from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "styled-components/native";
import LText from "./LText";
import Touchable from "./Touchable";
import ExternalLink from "../icons/ExternalLink";

type Props = {
  text: React$Node,
  onPress?: () => void | Promise<void>,
  event?: string,
  eventProperties?: Object,
  iconFirst?: boolean,
  ltextProps?: *,
  color?: string,
  style?: *,
  fontSize?: number,
};

const Link = ({
  text,
  onPress,
  event,
  eventProperties,
  ltextProps,
  color,
  style,
  fontSize = 12,
}: Props) => {
  const { colors } = useTheme();
  const c = color || colors.primary.c80;
  return (
    <Touchable
      event={event}
      eventProperties={eventProperties}
      onPress={onPress}
      style={[styles.root, style]}
    >
      <LText
        semiBold
        style={[styles.text, { fontSize, color: c }]}
        {...ltextProps}
      >
        {text}
      </LText>
      <ExternalLink size={fontSize + 2} color={c} />
    </Touchable>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    lineHeight: 18,
    paddingRight: 8,
  },
});

export default Link;
