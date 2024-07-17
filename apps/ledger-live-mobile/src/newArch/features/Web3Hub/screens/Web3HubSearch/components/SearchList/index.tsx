import React from "react";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Text } from "@ledgerhq/native-ui";
import { MAIN_BUTTON_BOTTOM, MAIN_BUTTON_SIZE } from "~/components/TabBar/shared";
import SearchItem, { type NavigationProp } from "./SearchItem";
import LoadingIndicator from "LLM/features/Web3Hub/components/ManifestsList/LoadingIndicator";
import useSearchListViewModel from "./useSearchListViewModel";

export default function SearchList({
  navigation,
  search,
}: {
  navigation: NavigationProp;
  search: string;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, isLoading, onEndReached } = useSearchListViewModel(search);

  return (
    <FlashList
      testID="web3hub-manifests-search-scroll"
      nestedScrollEnabled
      contentContainerStyle={{
        // Using this padding to keep the view visible under the button
        paddingBottom: MAIN_BUTTON_SIZE + MAIN_BUTTON_BOTTOM + insets.bottom,
      }}
      // keyExtractor={item => item.id}
      renderItem={({ item }) => {
        return <SearchItem manifest={item} navigation={navigation} />;
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
  );
}
