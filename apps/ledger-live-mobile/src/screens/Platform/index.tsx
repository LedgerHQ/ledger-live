import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { AppManifest } from "@ledgerhq/live-common/platform/types";
import { useSelector } from "react-redux";
import { useBanner } from "../../components/banners/hooks";
import TrackScreen from "../../analytics/TrackScreen";
import { ScreenName } from "../../const";
import CatalogTwitterBanner from "./CatalogTwitterBanner";
import DAppDisclaimer from "./DAppDisclaimer";
import type { Props as DisclaimerProps } from "./DAppDisclaimer";
import CatalogBanner from "./CatalogBanner";
import AppCard from "./AppCard";
import AnimatedHeaderView from "../../components/AnimatedHeader";
import { TAB_BAR_SAFE_HEIGHT } from "../../components/TabBar/shared";
import TabBarSafeAreaView from "../../components/TabBar/TabBarSafeAreaView";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { useFilteredManifests } from "./shared";

type RouteParams = {
  defaultAccount: AccountLike | null | undefined;
  defaultParentAccount: Account | null | undefined;
  platform?: string | null | undefined;
};
type DisclaimerOpts = $Diff<
  DisclaimerProps,
  {
    isOpened: boolean;
  }
> | null;
const DAPP_DISCLAIMER_ID = "PlatformAppDisclaimer";

const PlatformCatalog = ({
  route,
}: {
  route: {
    params: RouteParams;
  };
}) => {
  const { platform, ...routeParams } = route.params ?? {};
  const navigation = useNavigation();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const filteredManifests = useFilteredManifests();
  // Disclaimer State
  const [disclaimerOpts, setDisclaimerOpts] = useState<DisclaimerOpts>(null);
  const [disclaimerOpened, setDisclaimerOpened] = useState<boolean>(false);
  const [disclaimerDisabled, setDisclaimerDisabled] =
    useBanner(DAPP_DISCLAIMER_ID);
  const handlePressCard = useCallback(
    (manifest: AppManifest) => {
      const openDApp = () =>
        navigation.navigate(ScreenName.PlatformApp, {
          ...routeParams,
          platform: manifest.id,
          name: manifest.name,
        });

      if (!disclaimerDisabled && !readOnlyModeEnabled) {
        setDisclaimerOpts({
          disableDisclaimer: () => setDisclaimerDisabled(),
          closeDisclaimer: () => setDisclaimerOpened(false),
          icon: manifest.icon,
          name: manifest.name,
          onContinue: openDApp,
        });
        setDisclaimerOpened(true);
      } else {
        openDApp();
      }
    },
    [
      navigation,
      routeParams,
      setDisclaimerDisabled,
      disclaimerDisabled,
      readOnlyModeEnabled,
    ],
  );
  useEffect(() => {
    // platform can be predefined when coming from a deeplink
    if (platform && filteredManifests) {
      const manifest = filteredManifests.find(m => m.id === platform);

      if (manifest) {
        navigation.navigate(ScreenName.PlatformApp, {
          ...routeParams,
          platform: manifest.id,
          name: manifest.name,
        });
      }
    }
  }, [platform, filteredManifests, navigation, routeParams]);
  return (
    <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
      <AnimatedHeaderView
        edges={[]}
        titleStyle={styles.title}
        title={<Trans i18nKey={"platform.catalog.title"} />}
        hasBackButton
      >
        <TrackScreen category="Platform" name="Catalog" />
        {disclaimerOpts && (
          <DAppDisclaimer
            disableDisclaimer={disclaimerOpts.disableDisclaimer}
            closeDisclaimer={disclaimerOpts.closeDisclaimer}
            onContinue={disclaimerOpts.onContinue}
            isOpened={disclaimerOpened}
            icon={disclaimerOpts.icon}
            name={disclaimerOpts.name}
          />
        )}

        <CatalogBanner />
        <CatalogTwitterBanner />
        {filteredManifests.map(manifest => (
          <AppCard
            key={`${manifest.id}.${manifest.branch}`}
            manifest={manifest}
            onPress={handlePressCard}
          />
        ))}
        <View style={styles.bottomPadding} />
      </AnimatedHeaderView>
    </TabBarSafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    lineHeight: 40,
    textAlign: "left",
  },
  bottomPadding: {
    paddingBottom: TAB_BAR_SAFE_HEIGHT,
  },
});
export default PlatformCatalog;
