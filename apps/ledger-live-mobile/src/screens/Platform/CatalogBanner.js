// @flow
import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import DAppsIcons from "../../icons/DAppsIcons";
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
      <DAppsIcons style={styles.backgroundImage} />
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
    overflow: "hidden",
    position: "relative",
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    color: "#fff",
  },
  description: {
    fontSize: 14,
    color: "#fff",
    paddingRight: 50,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "150%",
    right: "-40%",
    zIndex: -1,
  },
});

export default CatalogBanner;
