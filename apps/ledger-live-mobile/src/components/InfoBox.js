// @flow
import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import IconHelp from "../icons/Info";

type Props = {
  children: React$Node,
  onLearnMore?: () => any,
  forceColor?: { background?: string, text?: string, icon?: string },
};

export default function InfoBox({
  children: description,
  onLearnMore,
  forceColor = {},
}: Props) {
  const { colors } = useTheme();

  const { background, text, icon } = forceColor;

  const setColor = {
    background: background || colors.pillActiveBackground,
    text: text || colors.darkBlue,
    icon: icon || colors.live,
    learnMore: text || colors.live,
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: setColor.background,
        },
      ]}
    >
      <IconHelp color={setColor.icon} size={16} />
      <LText style={styles.content} color="live">
        <LText fontSize={3} style={{ color: setColor.text }}>
          {description}
        </LText>{" "}
        {onLearnMore && (
          <LText
            style={[styles.learnMore, { color: setColor.learnMore }]}
            fontSize={3}
            onPress={onLearnMore}
          >
            <Trans i18nKey={"common.learnMore"} />
          </LText>
        )}
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: "center",
  },
  content: {
    flex: 1,
    margin: 10,
    marginLeft: 16,
    alignItems: "center",
  },
  learnMore: {
    textDecorationLine: "underline",
  },
});
