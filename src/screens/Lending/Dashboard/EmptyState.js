// @flow

import React from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";
import ExternalLink from "../../../components/ExternalLink";
import { urls } from "../../../config/urls";

const EmptyState = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.card }]}>
      <LText style={styles.title} color="grey">
        <Trans i18nKey="transfer.lending.dashboard.emptySateDescription" />
      </LText>
      <ExternalLink
        text={<Trans i18nKey="transfer.lending.howDoesLendingWork" />}
        event="Lending Support Link Click"
        onPress={() => {
          Linking.openURL(urls.compound);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 4,
    borderRadius: 4,
  },
  title: {
    lineHeight: 19,
    fontSize: 13,
    textAlign: "center",
    paddingBottom: 16,
  },
});

export default EmptyState;
