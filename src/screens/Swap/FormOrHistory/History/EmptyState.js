// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import LText from "../../../../components/LText";

const EmptyState = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LText secondary style={styles.title}>
        <Trans i18nKey="transfer.swap.history.empty.title" />
      </LText>
      <LText primary style={styles.desc} color="grey">
        <Trans i18nKey="transfer.swap.history.empty.desc" />
      </LText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    textAlign: "center",
    marginHorizontal: 24,
  },
});

export default EmptyState;
