import React from "react";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import { Box, Text } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
      contentContainerStyle={{
        paddingBottom: insets.bottom,
      }}
      testID="web3hub-manifests-search-scroll"
      keyExtractor={item => item.id}
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
