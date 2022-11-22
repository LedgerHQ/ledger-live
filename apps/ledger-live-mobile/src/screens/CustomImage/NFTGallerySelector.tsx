import React, { useCallback, useMemo } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { decodeNftId } from "@ledgerhq/live-common/nft/nftId";
import { orderByLastReceived } from "@ledgerhq/live-common/nft/helpers";
import { useSelector } from "react-redux";
import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { accountsSelector } from "../../reducers/accounts";
import { hiddenNftCollectionsSelector } from "../../reducers/settings";
import NftListItem from "../../components/Nft/NftListItem";
import NftGalleryEmptyState from "../Nft/NftGallery/NftGalleryEmptyState";
import { NavigatorName, ScreenName } from "../../const";

const NB_COLUMNS = 2;

const NFTGallerySelector = () => {
  const navigation = useNavigation();
  const accounts = useSelector(accountsSelector);
  const nfts = accounts.map(a => a.nfts ?? []).flat();

  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const nftsOrdered: ProtoNFT[] = useMemo(() => {
    const visibleNfts = nfts.filter(
      nft =>
        !hiddenNftCollections.includes(
          `${decodeNftId(nft.id).accountId}|${nft.contract}`,
        ),
    );
    return orderByLastReceived(accounts, visibleNfts);
  }, [accounts, hiddenNftCollections, nfts]);

  const hasNFTs = nftsOrdered.length > 0;

  const keyExtractor = (item: ProtoNFT) => item.id;

  const handlePress = useCallback(
    (nft: ProtoNFT) => {
      navigation.navigate(NavigatorName.CustomImage, {
        screen: ScreenName.CustomImagePreviewPreEdit,
        params: {
          nft,
          device: null,
        },
      });
    },
    [navigation],
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: ProtoNFT;
    index: number;
    count?: number;
  }) => (
    <Flex flex={1} mr={index % NB_COLUMNS > 0 ? 0 : 6}>
      <NftListItem nft={item} onPress={handlePress} />
    </Flex>
  );
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Flex flex={1} px={6}>
        {hasNFTs ? (
          <FlatList
            numColumns={NB_COLUMNS}
            data={nfts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />
        ) : (
          <NftGalleryEmptyState />
        )}
      </Flex>
    </SafeAreaView>
  );
};

export default NFTGallerySelector;
