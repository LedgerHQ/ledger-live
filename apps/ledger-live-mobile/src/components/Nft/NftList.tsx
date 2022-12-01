import React, { useCallback } from "react";
import { FlatListProps } from "react-native";
import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";
import { useNavigation } from "@react-navigation/native";

import NftListItem from "./NftListItem";
import { AddNewItem } from "./AddNewItemList";
import CollapsibleHeaderFlatList from "../WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "../globalSyncRefreshControl";
import { track, TrackScreen } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl<
  FlatListProps<ProtoNFT>
>(CollapsibleHeaderFlatList, { progressViewOffset: 64 });

type Props = {
  data: ProtoNFT[];
};

// Fake ProtoNFT to be able to display "Add new" button at the end of the list
const ADD_NEW: ProtoNFT = {
  id: "addNew",
  tokenId: "",
  amount: new BigNumber(0),
  contract: "",
  standard: "ERC721",
  currencyId: "",
};

const NB_COLUMNS = 2;

const keyExtractor = (item: ProtoNFT) => item.id;

export function NftList({ data }: Props) {
  const dataWithAdd = data.concat(ADD_NEW);
  const navigation = useNavigation();

  const navigateToNftViewer = useCallback(
    (nft: ProtoNFT, metadata?: NFTMetadata) => {
      track("NFT_clicked", {
        NFT_collection: metadata?.tokenName,
        NFT_title: metadata?.nftName,
      });

      navigation.navigate(NavigatorName.NftNavigator, {
        screen: ScreenName.NftViewer,
        params: {
          nft,
        },
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProtoNFT; index: number; count?: number }) => (
      <Flex
        flex={
          item.id === ADD_NEW.id && (index + 1) % NB_COLUMNS !== 0
            ? 1 / NB_COLUMNS
            : 1
        }
        mr={(index + 1) % NB_COLUMNS > 0 ? 6 : 0}
      >
        {item.id === ADD_NEW.id ? (
          <AddNewItem />
        ) : (
          <NftListItem nft={item} onPress={navigateToNftViewer} />
        )}
      </Flex>
    ),
    [navigateToNftViewer],
  );

  return (
    <>
      <TrackScreen category="NFT Gallery" NFTs_owned={data.length} />

      <RefreshableCollapsibleHeaderFlatList
        numColumns={2}
        data={dataWithAdd}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={11}
        contentContainerStyle={{ marginTop: 16 }}
      />
    </>
  );
}
