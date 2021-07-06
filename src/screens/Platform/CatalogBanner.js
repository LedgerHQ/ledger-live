// @flow
import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";

const CatalogBanner = () => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.live,
        },
      ]}
    >
      <LText style={styles.title} semiBold>
        <Trans i18nKey="platform.catalog.banner.title" />
      </LText>
      <LText style={styles.description}>
        <Trans i18nKey="platform.catalog.banner.description" />
      </LText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flexDirection: "column",
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
    color: "#fff",
  },
  description: {
    fontSize: 14,
    color: "#fff",
  },
});

export default CatalogBanner;
