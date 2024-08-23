import React, { ComponentProps, useCallback, useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { Box, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import Disclaimer, { useDisclaimerViewModel } from "LLM/features/Web3Hub/components/Disclaimer";
import type { MainProps, SearchProps } from "LLM/features/Web3Hub/types";
import { NavigatorName, ScreenName } from "~/const";
import ManifestItem from "./ManifestItem";
import CategoriesList from "./CategoriesList";
import LoadingIndicator from "./LoadingIndicator";
import useManifestsListViewModel from "./useManifestsListViewModel";

type NavigationProp = MainProps["navigation"] | SearchProps["navigation"];

type Props = {
  navigation: NavigationProp;
  onScroll?: ComponentProps<typeof AnimatedFlashList>["onScroll"];
  title?: string;
  pt?: number;
  pb?: number;
  headerComponent?: React.ReactNode;
};

const AnimatedFlashList = Animated.createAnimatedComponent<FlashListProps<AppManifest>>(FlashList);

const keyExtractor = (item: AppManifest) => item.id;

const noop = () => {};

const renderItem = ({
  item,
  extraData = noop,
}: {
  item: AppManifest;
  extraData?: (manifest: AppManifest) => void;
}) => {
  return <ManifestItem manifest={item} onPress={extraData} />;
};

export default function ManifestsList({
  navigation,
  onScroll,
  title,
  pt = 0,
  pb = 0,
  headerComponent,
}: Props) {
  const { t } = useTranslation();
  const [selectedCategory, selectCategory] = useState("all");
  const { data, isLoading, onEndReached } = useManifestsListViewModel(selectedCategory);

  const goToApp = useCallback(
    (manifestId: string) => {
      navigation.push(NavigatorName.Web3Hub, {
        screen: ScreenName.Web3HubApp,
        params: {
          manifestId: manifestId,
        },
      });
    },
    [navigation],
  );

  const disclaimer = useDisclaimerViewModel(goToApp);

  return (
    <>
      <Disclaimer disclaimer={disclaimer} />
      <AnimatedFlashList
        contentContainerStyle={{
          paddingTop: pt,
          paddingBottom: pb,
        }}
        ListHeaderComponent={
          <>
            {headerComponent}
            <Text mt={5} numberOfLines={1} variant="h5" mx={5} accessibilityRole="header">
              {title ?? t("web3hub.components.manifestsList.title")}
            </Text>
            <Text mt={2} mb={5} numberOfLines={1} variant="body" mx={5} accessibilityRole="header">
              {t("web3hub.components.manifestsList.description")}
            </Text>
            <View style={{ height: 32, marginBottom: 2 }}>
              <CategoriesList selectedCategory={selectedCategory} selectCategory={selectCategory} />
            </View>
          </>
        }
        testID="web3hub-manifests-scroll"
        keyExtractor={keyExtractor}
        renderItem={renderItem}
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
        extraData={disclaimer.onPressItem}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={onEndReached}
      />
    </>
  );
}
