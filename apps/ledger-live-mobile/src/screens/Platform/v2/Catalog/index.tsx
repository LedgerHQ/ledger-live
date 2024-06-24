import React from "react";
import * as Animatable from "react-native-animatable";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
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

const AnimatedView = Animatable.View;

export function Catalog() {
  const { t } = useTranslation();
  const title = t("browseWeb3.catalog.title");
  const { categories, recentlyUsed, search, disclaimer, localLiveApps } = useCatalog();
  return (
    <TabBarSafeAreaView edges={["top", "bottom", "left", "right"]}>
      {/* TODO: put under the animation header and style  */}
      <TrackScreen category="Platform" name="Catalog" />
      <DAppDisclaimer disclaimer={disclaimer} />

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
              <AnimatedView animation="fadeInUp" delay={50} duration={300}>
                <Flex paddingTop={4}>
                  <ManifestList manifests={search.result} onSelect={disclaimer.onSelect} />
                </Flex>
              </AnimatedView>
            }
          />
        </>
      )}
    </TabBarSafeAreaView>
  );
}
