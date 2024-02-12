import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useSelector } from "react-redux";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useBanner } from "~/components/banners/hooks";
import TrackScreen from "~/analytics/TrackScreen";
import { ScreenName } from "~/const";
import TwitterBanner from "./TwitterBanner";
import DAppDisclaimer, { Props as DisclaimerProps } from "./DAppDisclaimer";
import Banner from "./Banner";
import AppCard from "./AppCard";
import AnimatedHeaderView from "~/components/AnimatedHeader";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { DiscoverNavigatorStackParamList } from "~/components/RootNavigator/types/DiscoverNavigator";

export type Props = BaseComposite<
  StackNavigatorProps<DiscoverNavigatorStackParamList, ScreenName.PlatformCatalog>
>;

type DisclaimerOpts =
  | (DisclaimerProps & {
      isOpened: boolean;
    })
  | null;
const DAPP_DISCLAIMER_ID = "PlatformAppDisclaimer";

const emptyObject: LiveAppManifest[] = [];

export function Catalog({ route, navigation }: Props) {
  const { platform, ...routeParams } = route.params ?? {};
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const { state } = useRemoteLiveAppContext();
  const manifests = state?.value?.liveAppFiltered || emptyObject;
  // Disclaimer State
  const [disclaimerOpts, setDisclaimerOpts] = useState<DisclaimerOpts>(null);
  const [disclaimerOpened, setDisclaimerOpened] = useState<boolean>(false);
  const [disclaimerDisabled, setDisclaimerDisabled] = useBanner(DAPP_DISCLAIMER_ID);
  const handlePressCard = useCallback(
    (manifest: LiveAppManifest) => {
      const openDApp = () =>
        navigation.navigate(ScreenName.PlatformApp, {
          ...routeParams,
          platform: manifest.id,
          name: manifest.name,
        });

      if (!disclaimerDisabled && !readOnlyModeEnabled) {
        setDisclaimerOpts({
          disableDisclaimer: () => {
            if (typeof setDisclaimerDisabled === "function") setDisclaimerDisabled();
          },
          closeDisclaimer: () => {
            setDisclaimerOpened(false);
          },
          icon: manifest.icon,
          name: manifest.name,
          onContinue: openDApp,
          isOpened: false,
        });
        setDisclaimerOpened(true);
      } else {
        openDApp();
      }
    },
    [navigation, routeParams, setDisclaimerDisabled, disclaimerDisabled, readOnlyModeEnabled],
  );
  useEffect(() => {
    // platform can be predefined when coming from a deeplink
    if (platform && manifests) {
      const manifest = manifests.find(m => m.id === platform);

      if (manifest) {
        navigation.navigate(ScreenName.PlatformApp, {
          ...routeParams,
          platform: manifest.id,
          name: manifest.name,
        });
      }
    }
  }, [platform, manifests, navigation, routeParams]);
  return (
    <TabBarSafeAreaView edges={["left", "right"]}>
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

        <Banner />
        <TwitterBanner />
        {manifests.map(manifest => (
          <AppCard
            key={`${manifest.id}.${manifest.branch}`}
            manifest={manifest as LiveAppManifest}
            onPress={handlePressCard}
          />
        ))}
        <View />
      </AnimatedHeaderView>
    </TabBarSafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    lineHeight: 40,
    textAlign: "left",
  },
});
