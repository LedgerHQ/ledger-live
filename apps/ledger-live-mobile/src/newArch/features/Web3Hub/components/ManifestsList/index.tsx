import React, { useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { Box, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import ManifestItem, { type NavigationProp } from "./ManifestItem";
import CategoriesList from "./CategoriesList";
import LoadingIndicator from "./LoadingIndicator";
import useManifestsListViewModel from "./useManifestsListViewModel";

type Props = {
  navigation: NavigationProp;
  onScroll?: FlashListProps<AppManifest>["onScroll"];
  pb?: number;
};

const AnimatedFlashList = Animated.createAnimatedComponent<FlashListProps<AppManifest>>(FlashList);

export default function ManifestsList({ navigation, onScroll, pb = 0 }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedCategory, selectCategory] = useState("all");
  const { data, isLoading, onEndReached } = useManifestsListViewModel(selectedCategory);

  return (
    <AnimatedFlashList
      contentContainerStyle={{
        paddingBottom: pb + insets.bottom,
      }}
      ListHeaderComponent={
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
        </>
      }
      testID="web3hub-manifests-scroll"
      keyExtractor={item => item.id}
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
      onScroll={onScroll}
      scrollEventThrottle={16}
      onEndReached={onEndReached}
    />
  );
}
