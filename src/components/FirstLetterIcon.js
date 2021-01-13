// @flow
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";

type Props = {
  label: string,
  style?: *,
  labelStyle?: *,
  size?: number,
  fontSize?: number,
  round?: boolean,
};

const FirstLetterIcon = ({
  label,
  style,
  labelStyle,
  size = 32,
  fontSize = 16,
  round = false,
}: Props) => {
  const { colors } = useTheme();
  const isEmoji = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(
    label.trim().substring(0, 2),
  );

  const text = label && label.trim().substring(0, isEmoji ? 2 : 1);
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.lightLive },
        style,
        { width: size, height: size, lineHeight: size },
        round ? { borderRadius: size / 2 } : undefined,
      ]}
    >
      <LText
        semiBold
        style={[{ lineHeight: size }, styles.label, { fontSize }, labelStyle]}
      >
        {text}
      </LText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    paddingHorizontal: 5,
    alignContent: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    lineHeight: 32,
    textAlign: "center",
    textTransform: "uppercase",
  },
});

export default FirstLetterIcon;
