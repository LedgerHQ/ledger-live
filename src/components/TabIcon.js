/* @flow */
import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import LText from "./LText";

type Props = {
  color: string,
  focused: boolean,
  i18nKey: string,
  Icon: any,
};

export default function TabIcon({ Icon, i18nKey, color, focused }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <Icon size={24} color={color} />
      <LText
        numberOfLines={1}
        semiBold={!focused}
        bold={focused}
        secondary
        style={[styles.text, { color }]}
      >
        {t(i18nKey)}
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  text: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
    paddingVertical: 6,
  },
});
