// @flow
import React, { memo } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import LiveLogo from "../icons/LiveLogoIcon";
import LText from "./LText";
import Spinning from "./Spinning";

function HeaderSynchronizing() {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Spinning>
        <LiveLogo size={16} color={colors.grey} />
      </Spinning>
      <LText
        secondary
        style={styles.title}
        color="grey"
        semiBold
        numberOfLines={1}
      >
        <Trans i18nKey="portfolio.syncPending" />
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    justifyContent: "center",
    marginLeft: 10,
  },
});

export default memo(HeaderSynchronizing);
