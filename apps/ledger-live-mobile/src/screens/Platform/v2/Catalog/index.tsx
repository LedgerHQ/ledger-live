import React from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NavigationProps } from "../types";
import ArrowLeft from "~/icons/ArrowLeft";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
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

export function Catalog() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const title = t("browseWeb3.catalog.title");

  const { params } = useRoute();

  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");

  const deeplinkInitialCategory =
    params && "category" in params && typeof params.category === "string" ? params.category : null;

  const { categories, recentlyUsed, search, disclaimer, localLiveApps } =
    useCatalog(deeplinkInitialCategory);

  return (
    <TabBarSafeAreaView edges={["top", "bottom", "left", "right"]}>
      {/* TODO: put under the animation header and style  */}
      <TrackScreen category="Platform" name="Catalog" />
      <View>
        <DAppDisclaimer disclaimer={disclaimer} />
      </View>

      {search.isActive ? (
        <Animated.View
          key="search-mode"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={{ flex: 1 }}
        >
          <Search
            title={shouldDisplayWallet40MainNav ? undefined : title}
            disclaimer={disclaimer}
            search={search}
            isLegacySearch={!shouldDisplayWallet40MainNav}
          />
        </Animated.View>
      ) : (
        <Animated.View
          key="normal-mode"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={{ flex: 1 }}
        >
          <Layout
            listStickyElement={[2]}
            topHeaderContent={
              shouldDisplayWallet40MainNav ? (
                <TouchableOpacity
                  hitSlop={{ bottom: 10, left: 24, right: 24, top: 10 }}
                  style={{ paddingVertical: 16 }}
                  onPress={() => navigation.goBack()}
                  accessibilityLabel={t("common.back")}
                  accessibilityRole="button"
                >
                  <ArrowLeft size={18} color={colors.neutral.c100} testID="catalog-back-arrow" />
                </TouchableOpacity>
              ) : undefined
            }
            title={shouldDisplayWallet40MainNav ? title : undefined}
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
        </Animated.View>
      )}
    </TabBarSafeAreaView>
  );
}
