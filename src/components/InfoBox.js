// @flow
import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, Text } from "react-native";
import LText from "./LText";
import colors from "../colors";
import IconHelp from "../icons/Info";

type Props = {
  children: React$Node,
  onLearnMore?: () => any,
};

export default function InfoBox({ children: description, onLearnMore }: Props) {
  return (
    <View style={styles.root}>
      <IconHelp color={colors.live} size={16} />
      <Text style={styles.content}>
        <LText fontSize={3}>{description}</LText>{" "}
        {onLearnMore && (
          <LText style={styles.learnMore} fontSize={3} onPress={onLearnMore}>
            <Trans i18nKey={"common.learnMore"} />
          </LText>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.pillActiveBackground,
    color: colors.darkBlue,
    borderRadius: 4,
    alignItems: "center",
  },
  content: {
    color: colors.live,
    flex: 1,
    margin: 10,
    marginLeft: 16,
    alignItems: "center",
  },
  learnMore: {
    textDecorationLine: "underline",
  },
});
