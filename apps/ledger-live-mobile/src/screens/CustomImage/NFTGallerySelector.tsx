import React, { useCallback, useMemo } from "react";
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
import { isThresholdValid, useNftGalleryFilter } from "@ledgerhq/live-nft-react";
import { supportedChains } from "@ledgerhq/live-nft-react";

const NB_COLUMNS = 2;

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImageNFTGallery>
>;

const keyExtractor = (item: ProtoNFT) => item.id;

const NFTGallerySelector = ({ navigation, route }: NavigationProps) => {
  const { params } = route;
  const { device, deviceModelId } = params;

  const nftsOrdered = useSelector(orderedVisibleNftsSelector, isEqual);

  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const thresold = nftsFromSimplehashFeature?.params?.threshold;
  const nftsFromSimplehashEnabled = nftsFromSimplehashFeature?.enabled;
  const accounts = useSelector(accountsSelector);

  const addresses = useMemo(
    () =>
      [
        ...new Set(
          accounts.map(account => account.freshAddress).filter(addr => addr.startsWith("0x")),
        ),
      ].join(","),
    [accounts],
  );

  const { nfts: filteredNfts, isLoading } = useNftGalleryFilter({
    nftsOwned: nftsOrdered || [],
    addresses: addresses,
    chains: supportedChains,
    threshold: isThresholdValid(thresold) ? Number(thresold) : 75,
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
