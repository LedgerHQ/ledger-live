import React from "react";
import { SafeAreaView, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { Layout } from "./Layout";
import { useCatalog } from "../hooks";
import TrackScreen from "~/analytics/TrackScreen";
import { Search, SearchBar } from "./Search";
import { ManifestList } from "./ManifestList";
import { RecentlyUsed } from "./RecentlyUsed";
import { CatalogSection } from "./CatalogSection";
import { DAppDisclaimer } from "./DAppDisclaimer";
import { LocalLiveApp } from "./LocalLiveApp";
import { useRoute } from "@react-navigation/native";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

export function Catalog() {
  const { t } = useTranslation();
  const title = t("browseWeb3.catalog.title");

  const { params } = useRoute();

  const deeplinkInitialCategory =
    params && "category" in params && typeof params.category === "string" ? params.category : null;

  const { categories, recentlyUsed, search, disclaimer, localLiveApps } =
    useCatalog(deeplinkInitialCategory);

  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");

  const edges = shouldDisplayWallet40MainNav
    ? ["left", "right"]
    : ["top", "bottom", "left", "right"];

  const ContainerView = shouldDisplayWallet40MainNav ? SafeAreaView : TabBarSafeAreaView;

  return (
    <ContainerView edges={edges}>
      {/* TODO: put under the animation header and style  */}
      <TrackScreen category="Platform" name="Catalog" />
      <View>
        <DAppDisclaimer disclaimer={disclaimer} />
      </View>

      {search.isActive ? (
        <Search title={title} disclaimer={disclaimer} search={search} />
      ) : (
        <>
          <Layout
            listStickyElement={[2]}
            middleHeaderContent={
              <>
                <Flex marginBottom={16}>
                  <Text fontWeight="semiBold" variant="h4" testID="discover-banner">
                    {title}
                  </Text>
                </Flex>
                <SearchBar search={search} />
              </>
            }
            disableStyleBottomHeader
            bottomHeaderContent={
              <>
                {localLiveApps.length !== 0 && <LocalLiveApp localLiveApps={localLiveApps} />}
                <RecentlyUsed recentlyUsed={recentlyUsed} disclaimer={disclaimer} />
              </>
            }
            disableStyleSubBottomHeader
            subBottomHeaderContent={<CatalogSection categories={categories} />}
            bodyContent={
              <Animated.View entering={FadeInUp.delay(50).duration(300)}>
                <Flex paddingTop={4}>
                  <ManifestList manifests={search.result} onSelect={disclaimer.onSelect} />
                </Flex>
              </Animated.View>
            }
          />
        </>
      )}
    </ContainerView>
  );
}
