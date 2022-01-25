// @flow
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import LText from "../../components/LText";
import Coinify from "../../icons/Coinify";

export default function PoweredByCoinify() {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <LText color="grey" semiBold style={styles.label}>
        <Trans i18nKey="common.poweredBy" />
      </LText>
      <Coinify color={colors.grey} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  label: {
    fontSize: 8,
  },
});
