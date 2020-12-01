// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../../components/LText";
import colors from "../../../colors";

const EmptyState = () => (
  <View style={styles.root}>
    <LText secondary style={styles.title}>
      <Trans i18nKey="transfer.swap.history.empty.title" />
    </LText>
    <LText primary style={styles.desc}>
      <Trans i18nKey="transfer.swap.history.empty.desc" />
    </LText>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 18,
    color: colors.darkBlue,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    color: colors.grey,
    textAlign: "center",
    marginHorizontal: 24,
  },
});

export default EmptyState;
