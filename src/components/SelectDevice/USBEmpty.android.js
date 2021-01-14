// @flow

import React from "react";
import { View, StyleSheet } from "react-native";

import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "../LText";
import USBIcon from "../../icons/USB";

export default function USBEmpty({ usbOnly }: { usbOnly: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.lightLive }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.white }]}>
        <USBIcon width={6} height={16} />
      </View>
      <View style={styles.textContainer}>
        {!usbOnly && (
          <LText semiBold style={[styles.title, { color: colors.live }]}>
            <Trans i18nKey="SelectDevice.usb" />
          </LText>
        )}
        <LText semiBold style={[styles.text, { color: colors.live }]}>
          <Trans i18nKey="SelectDevice.usbLabel" />
        </LText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    lineHeight: 24,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  textContainer: {
    flexDirection: "column",
    alignContent: "flex-start",
    justifyContent: "flex-start",
    flexShrink: 1,
    marginLeft: 20,
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
  },
});
