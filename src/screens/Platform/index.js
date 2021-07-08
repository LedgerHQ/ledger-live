// @flow

import React, { useMemo, useCallback } from "react";
import { StyleSheet, ScrollView, View, Linking } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { useCatalog } from "@ledgerhq/live-common/lib/platform/CatalogProvider";
import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import type { AppManifest } from "@ledgerhq/live-common/lib/platform/types";

import TrackScreen from "../../analytics/TrackScreen";
import { urls } from "../../config/urls";
import { ScreenName } from "../../const";
import IconCode from "../../icons/Code";

import CatalogTwitterBanner from "./CatalogTwitterBanner";
import CatalogBanner from "./CatalogBanner";
import CatalogCTA from "./CatalogCTA";
import AppCard from "./AppCard";
import AnimatedHeaderView from "../../components/AnimatedHeader";

type RouteParams = {
  defaultAccount: ?AccountLike,
  defaultParentAccount: ?Account,
};

const PlatformCatalog = ({ route }: { route: { params: RouteParams } }) => {
  const { params: routeParams } = route;
  const { colors } = useTheme();
  const navigation = useNavigation();
  const appBranches = useMemo(() => {
    const branches = ["stable", "soon", "experimental"];

    // TODO: add experimental setting

    if (getEnv("PLATFORM_DEBUG")) {
      branches.push("debug");
    }

    return branches;
  }, []);

  const { apps } = useCatalog("mobile", appBranches);

  const handlePressCard = useCallback(
    (manifest: AppManifest) => {
      navigation.navigate(ScreenName.PlatformApp, {
        ...routeParams,
        platform: manifest.id,
        name: manifest.name,
      });
    },
    [navigation, routeParams],
  );

  const handleDeveloperCTAPress = useCallback(() => {
    Linking.openURL(urls.platform.developerPage);
  }, []);

  return (
    <AnimatedHeaderView
      titleStyle={styles.title}
      title={<Trans i18nKey={"platform.catalog.title"} />}
    >
      <TrackScreen category="Platform" name="Catalog" />
      <ScrollView style={styles.wrapper}>
        <CatalogBanner />
        <CatalogTwitterBanner />
        {apps.map(manifest => (
          <AppCard
            key={manifest.id}
            manifest={manifest}
            onPress={handlePressCard}
          />
        ))}
        <View style={[styles.separator, { backgroundColor: colors.fog }]} />
        <CatalogCTA
          Icon={IconCode}
          title={<Trans i18nKey={"platform.catalog.developerCTA.title"} />}
          onPress={handleDeveloperCTAPress}
        >
          <Trans i18nKey={"platform.catalog.developerCTA.description"} />
        </CatalogCTA>
      </ScrollView>
    </AnimatedHeaderView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    textAlign: "left",
  },
  separator: {
    width: "100%",
    height: 1,
    marginBottom: 24,
  },
});

export default PlatformCatalog;
