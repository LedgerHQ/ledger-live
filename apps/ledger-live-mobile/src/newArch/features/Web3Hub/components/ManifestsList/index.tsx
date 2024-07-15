import React, { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import {
  GetNextPageParamFunction,
  InfiniteData,
  QueryFunction,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Text } from "@ledgerhq/native-ui";
import { MAIN_BUTTON_BOTTOM, MAIN_BUTTON_SIZE } from "~/components/TabBar/shared";
import ManifestItem, { type NavigationProp } from "./ManifestItem";
import CategoriesList from "./CategoriesList";
import LoadingIndicator from "./LoadingIndicator";
// Temporary and will be replaced with proper mocks in hooks using tanstack query
import { data } from "../../__integrations__/mocks/manifests";

const manifests = [
  ...data,
  ...data,
  ...data,
  ...data,
  ...data,
  ...data,
  ...data,
  ...data,
  ...data,
  ...data,
  ...data,
  ...data,
  ...data,
];

const PAGE_SIZE = 10;

const fetchManifestsMock: (
  category: string,
) => QueryFunction<LiveAppManifest[], string[], number> =
  category =>
  async ({ pageParam }) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    let list = manifests;

    if (category !== "all") {
      list = list.filter(manifest => {
        return manifest.categories.includes(category);
      });
    }

    return list.slice((pageParam - 1) * PAGE_SIZE, pageParam * PAGE_SIZE);
  };

const selectManifests = (data: InfiniteData<LiveAppManifest[], number>) => {
  return data.pages.flat(1);
};

const getNextPageParam: GetNextPageParamFunction<number, LiveAppManifest[]> = (
  lastPage,
  allPages,
  lastPageParam,
) => {
  if (allPages.length === 0) {
    return undefined;
  }
  if (lastPage.length < PAGE_SIZE) {
    return undefined;
  }
  return lastPageParam + 1;
};

export default function ManifestList({ navigation }: { navigation: NavigationProp }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedCategory, selectCategory] = useState("all");

  const manifestsQuery = useInfiniteQuery({
    queryKey: ["web3hub/manifests", selectedCategory],
    queryFn: fetchManifestsMock(selectedCategory),
    initialPageParam: 1,
    getNextPageParam,
    select: selectManifests,
  });

  const isLoading = manifestsQuery.isLoading || manifestsQuery.isFetching;

  return (
    <>
      <Text mt={5} numberOfLines={1} variant="h5" mx={5} accessibilityRole="header">
        {t("web3hub.manifestsList.title")}
      </Text>
      <Text mt={2} mb={5} numberOfLines={1} variant="body" mx={5} accessibilityRole="header">
        {t("web3hub.manifestsList.description")}
      </Text>

      <View style={{ height: 32, marginBottom: 2 }}>
        <CategoriesList selectedCategory={selectedCategory} selectCategory={selectCategory} />
      </View>

      <FlashList
        testID="web3hub-manifests-scroll"
        nestedScrollEnabled
        contentContainerStyle={{
          // Using this padding to keep the view visible under the button
          paddingBottom: MAIN_BUTTON_SIZE + MAIN_BUTTON_BOTTOM + insets.bottom,
        }}
        // keyExtractor={item => item.id}
        renderItem={({ item }) => {
          return <ManifestItem manifest={item} navigation={navigation} />;
        }}
        ListFooterComponent={isLoading ? <LoadingIndicator /> : null}
        ListEmptyComponent={
          isLoading ? null : ( // TODO handle empty case
            <Box height={40}>
              <Text>{t("common.retry")}</Text>
            </Box>
          )
        }
        estimatedItemSize={128}
        data={manifestsQuery.data}
        onEndReached={manifestsQuery.hasNextPage ? manifestsQuery.fetchNextPage : undefined}
      />
    </>
  );
}
