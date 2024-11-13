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
import { getEnv } from "@ledgerhq/live-env";
import { useNftCollections } from "~/hooks/nfts/useNftCollections";

const NB_COLUMNS = 2;

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImageNFTGallery>
>;

const keyExtractor = (item: ProtoNFT) => item.id;

const NFTGallerySelector = ({ navigation, route }: NavigationProps) => {
  const { params } = route;
  const { device, deviceModelId } = params;

  const SUPPORTED_NFT_CURRENCIES = getEnv("NFT_CURRENCIES");

  const nftsOrdered = useSelector(orderedVisibleNftsSelector, isEqual);

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

  const { allNfts, isLoading } = useNftCollections({
    nftsOwned: nftsOrdered,
    addresses: addresses,
    chains: SUPPORTED_NFT_CURRENCIES,
  });

  const hasNfts = allNfts.length > 0;

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
      const incompleteLastRowFirstIndex = allNfts.length - (allNfts.length % NB_COLUMNS) - 1;
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
    [handlePress, allNfts.length],
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
            data={allNfts}
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
