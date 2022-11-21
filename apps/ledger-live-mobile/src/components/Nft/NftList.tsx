import React from "react";
import { FlatListProps } from "react-native";
import { ProtoNFT } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";
import NftListItem from "./NftListItem";
import { AddNewItem } from "./AddNewItemList";
import CollapsibleHeaderFlatList from "../WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "../globalSyncRefreshControl";
import { TrackScreen } from "../../analytics";

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

const renderItem = ({
  item,
  index,
}: {
  item: ProtoNFT;
  index: number;
  count?: number;
}) => (
  <Flex
    flex={
      item.id === ADD_NEW.id && (index + 1) % NB_COLUMNS !== 0
        ? 1 / NB_COLUMNS
        : 1
    }
    mr={(index + 1) % NB_COLUMNS > 0 ? 6 : 0}
  >
    {item.id === ADD_NEW.id ? <AddNewItem /> : <NftListItem nft={item} />}
  </Flex>
);

const keyExtractor = (item: ProtoNFT) => item.id;

export function NftList({ data }: Props) {
  const dataWithAdd = data.concat(ADD_NEW);

  return (
    <>
      <TrackScreen
        category="NFT Gallery"
        name="NFT Gallery"
        source="NFT tab"
        NFTs_owned={data.length}
      />

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
