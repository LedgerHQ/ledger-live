// @flow
import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, Text } from "react-native";
import LText from "./LText";
import colors, { rgba } from "../colors";
import IconHelp from "../icons/Info";

type Props = {
  children: React$Node,
  onLearnMore?: () => any,
  learnMoreKey?: String,
};

export default function WarningBox({
  children: description,
  onLearnMore,
  learnMoreKey,
}: Props) {
  return (
    <View style={styles.root}>
      <IconHelp color={colors.lightOrange} size={16} />
      <Text style={styles.content}>
        <LText fontSize={3}>{description}</LText>{" "}
        {onLearnMore && (
          <LText
            semiBold
            style={styles.learnMore}
            fontSize={3}
            onPress={onLearnMore}
          >
            <Trans i18nKey={learnMoreKey || "common.learnMore"} />
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
    backgroundColor: rgba(colors.lightOrange, 0.1),
    color: colors.lightOrange,
    borderRadius: 4,
    alignItems: "center",
  },
  content: {
    color: colors.lightOrange,
    flex: 1,
    margin: 10,
    marginLeft: 16,
    alignItems: "center",
  },
  learnMore: {
    textDecorationLine: "underline",
    marginTop: 8,
  },
});
