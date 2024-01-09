import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ProtoNFT } from "@ledgerhq/types-live";
import { FlatList } from "react-native";
import { isEqual } from "lodash";

import { orderedVisibleNftsSelector } from "~/reducers/accounts";
import NftListItem from "~/components/Nft/NftGallery/NftListItem";
import NftGalleryEmptyState from "../Nft/NftGallery/NftGalleryEmptyState";
import { NavigatorName, ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { TrackScreen } from "~/analytics";

const NB_COLUMNS = 2;

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImageNFTGallery>
>;

const keyExtractor = (item: ProtoNFT) => item.id;

const NFTGallerySelector = ({ navigation, route }: NavigationProps) => {
  const { params } = route;
  const { device } = params;

  const nftsOrdered = useSelector(orderedVisibleNftsSelector, isEqual);

  const hasNFTs = nftsOrdered.length > 0;

  const handlePress = useCallback(
    (nft: ProtoNFT) => {
      navigation.navigate(NavigatorName.CustomImage, {
        screen: ScreenName.CustomImagePreviewPreEdit,
        params: {
          nftMetadataParams: [nft.contract, nft.tokenId, nft.currencyId],
          device,
        },
      });
    },
    [navigation, device],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProtoNFT; index: number }) => {
      const count = nftsOrdered.length;
      const incompleteLastRowFirstIndex = count - (count % NB_COLUMNS) - 1;
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
    [handlePress, nftsOrdered.length],
  );
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <TrackScreen category="Choose lockscreen from NFT gallery" />
      <Flex flex={1} px={6}>
        {hasNFTs ? (
          <FlatList
            key={NB_COLUMNS}
            numColumns={NB_COLUMNS}
            data={nftsOrdered}
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
