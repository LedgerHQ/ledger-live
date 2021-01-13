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
};

export default function InfoBox({ children: description, onLearnMore }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.pillActiveBackground,
          color: colors.darkBlue,
        },
      ]}
    >
      <IconHelp color={colors.live} size={16} />
      <LText style={styles.content} color="live">
        <LText fontSize={3}>{description}</LText>{" "}
        {onLearnMore && (
          <LText style={styles.learnMore} fontSize={3} onPress={onLearnMore}>
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
