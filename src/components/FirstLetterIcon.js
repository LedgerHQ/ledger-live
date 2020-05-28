// @flow
import React from "react";
import { StyleSheet, View } from "react-native";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import LText from "./LText";
import colors from "../colors";

type Props = {
  label: string,
  style?: ViewStyleProp,
  size?: number,
  fontSize?: number,
  round?: boolean,
};

const FirstLetterIcon = ({
  label,
  style,
  size = 32,
  fontSize = 16,
  round = false,
}: Props) => {
  const isEmoji = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(
    label.substring(0, 2),
  );

  const text = label && label.substring(0, isEmoji ? 2 : 1);
  return (
    <View
      style={[
        styles.root,
        style,
        { width: size, height: size, lineHeight: size },
        round ? { borderRadius: size / 2 } : undefined,
      ]}
    >
      <LText
        semiBold
        style={[{ lineHeight: size }, styles.label, { fontSize }]}
      >
        {text}
      </LText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    backgroundColor: colors.lightLive,
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
