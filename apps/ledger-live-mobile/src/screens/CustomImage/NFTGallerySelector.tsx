import React, { useCallback } from "react";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ProtoNFT } from "@ledgerhq/types-live";
import { FlatList } from "react-native";
import isEqual from "lodash/isEqual";

import { accountsSelector, orderedVisibleNftsSelector } from "~/reducers/accounts";
import NftListItem from "~/components/Nft/NftGallery/NftListItem";
import NftGalleryEmptyState from "../Nft/NftGallery/NftGalleryEmptyState";
import { NavigatorName, ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { TrackScreen } from "~/analytics";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { getThreshold, useNftGalleryFilter, useNftQueriesSources } from "@ledgerhq/live-nft-react";
import { getEnv } from "@ledgerhq/live-env";
import { State } from "~/reducers/types";

const NB_COLUMNS = 2;

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImageNFTGallery>
>;

const keyExtractor = (item: ProtoNFT) => item.id;

const NFTGallerySelector = ({ navigation, route }: NavigationProps) => {
  const { params } = route;
  const { device, deviceModelId } = params;
  const SUPPORTED_NFT_CURRENCIES = getEnv("NFT_CURRENCIES");

  const llmSolanaNftsFeature = useFeature("llmSolanaNfts");

  const nftsOrdered = useSelector(
    (state: State) =>
      orderedVisibleNftsSelector(state, Boolean(nftsFromSimplehashFeature?.enabled)),
    isEqual,
  );

  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");

  const threshold = nftsFromSimplehashFeature?.params?.threshold;
  const nftsFromSimplehashEnabled = nftsFromSimplehashFeature?.enabled;
  const accounts = useSelector(accountsSelector);

  const { addresses, chains } = useNftQueriesSources({
    accounts,
    supportedCurrencies: SUPPORTED_NFT_CURRENCIES,
    config: { featureFlagEnabled: llmSolanaNftsFeature?.enabled },
  });

  const { nfts: filteredNfts, isLoading } = useNftGalleryFilter({
    nftsOwned: nftsOrdered || [],
    addresses,
    chains,
    threshold: getThreshold(threshold),
    enabled: nftsFromSimplehashEnabled || false,
    staleTime: nftsFromSimplehashFeature?.params?.staleTime,
  });

  const nfts = nftsFromSimplehashEnabled ? filteredNfts : nftsOrdered;
  const hasNfts = nfts.length > 0;

  const handlePress = useCallback(
    (nft: ProtoNFT) => {
      navigation.navigate(NavigatorName.CustomImage, {
        screen: ScreenName.CustomImagePreviewPreEdit,
        params: {
          nftMetadataParams: [nft.contract, nft.tokenId, nft.currencyId],
          device,
          deviceModelId,
        },
      });
    },
    [navigation, device, deviceModelId],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProtoNFT; index: number }) => {
      const incompleteLastRowFirstIndex = nfts.length - (nfts.length % NB_COLUMNS) - 1;
      const isOnIncompleteLastRow = index > incompleteLastRowFirstIndex;
      return (
        <Flex
          flex={isOnIncompleteLastRow ? 1 / NB_COLUMNS : 1}
          mr={index % NB_COLUMNS === NB_COLUMNS - 1 ? 0 : 6}
        >
          <NftListItem nft={item} onPress={handlePress} />
        </Flex>
      );
    },
    [handlePress, nfts.length],
  );
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <TrackScreen category="Choose lockscreen from NFT gallery" />
      <Flex flex={1} px={6}>
        {isLoading ? (
          <InfiniteLoader />
        ) : hasNfts ? (
          <FlatList
            key={NB_COLUMNS}
            numColumns={NB_COLUMNS}
            data={nfts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            initialNumToRender={6}
            windowSize={11}
          />
        ) : (
          <NftGalleryEmptyState />
        )}
      </Flex>
    </SafeAreaView>
  );
};

export default NFTGallerySelector;
