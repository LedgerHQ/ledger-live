import React, { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Text } from "@ledgerhq/native-ui";
import { MAIN_BUTTON_BOTTOM, MAIN_BUTTON_SIZE } from "~/components/TabBar/shared";
import ManifestItem, { type NavigationProp } from "./ManifestItem";
import CategoriesList from "./CategoriesList";
import LoadingIndicator from "./LoadingIndicator";
import useManifestsListViewModel from "./useManifestsListViewModel";

export default function ManifestsList({ navigation }: { navigation: NavigationProp }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedCategory, selectCategory] = useState("all");
  const { data, isLoading, onEndReached } = useManifestsListViewModel(selectedCategory);

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
        data={data}
        onEndReached={onEndReached}
      />
    </>
  );
}
