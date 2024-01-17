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

const AnimatedView = Animatable.View;

export function Catalog() {
  const { t } = useTranslation();
  const title = t("browseWeb3.catalog.title");
  const { categories, recentlyUsed, search, disclaimer } = useCatalog();

  return (
    <TabBarSafeAreaView edges={["top", "bottom", "left", "right"]}>
      {/* TODO: put under the animation header and style  */}
      <TrackScreen category="Platform" name="Catalog" />
      <DAppDisclaimer disclaimer={disclaimer} />

      {search.isActive ? (
        <Search title={title} categories={categories} disclaimer={disclaimer} search={search} />
      ) : (
        <>
          <Layout
            listStickyElement={[2]}
            middleHeaderContent={
              <>
                <Flex marginBottom={16}>
                  <Text fontWeight="semiBold" variant="h4">
                    {title}
                  </Text>
                </Flex>
                <SearchBar search={search} />
              </>
            }
            disableStyleBottomHeader
            bottomHeaderContent={
              <RecentlyUsed recentlyUsed={recentlyUsed} disclaimer={disclaimer} />
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
