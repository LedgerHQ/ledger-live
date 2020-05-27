// @flow
import React from "react";
import { StyleSheet, View } from "react-native";
import LText from "./LText";
import colors from "../colors";

type Props = {
  label: string,
  style?: *,
};

const FirstLetterIcon = ({ label, style }: Props) => {
  const isEmoji = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(
    label.substring(0, 2),
  );

  const text = label && label.substring(0, isEmoji ? 2 : 1);
  return (
    <View style={[styles.root, style]}>
      <LText semiBold style={styles.label}>
        {text}
      </LText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: colors.lightLive,
    paddingHorizontal: 5,
    alignContent: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    fontSize: 16,
    lineHeight: 32,
    textAlign: "center",
    textTransform: "uppercase",
  },
});

export default FirstLetterIcon;
