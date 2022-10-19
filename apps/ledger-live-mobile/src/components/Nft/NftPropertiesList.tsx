import React from "react";
import { FlatList, FlatListProps } from "react-native";
import { ProtoNFT } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";
import NftListItem from "./NftListItem";
import { AddNewItem } from "./AddNewItemList";
import { NFTMetadata } from "../../../../../libs/ledgerjs/packages/types-live/src";

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
  item: Record<"key" | "value", string>;
  index: number;
}) => (
  <Flex
    flex={
      item.id === ADD_NEW.id && (index + 1) % NB_COLUMNS !== 0
        ? 1 / NB_COLUMNS
        : 1
    }
    mr={(index + 1) % NB_COLUMNS > 0 ? 4 : 0}
  >
    {item.id === ADD_NEW.id ? <AddNewItem /> : <NftListItem nft={item} />}
  </Flex>
);

const keyExtractor = (item: Record<"key" | "value", string>) => item.key;

export function NftPropertiesList({
  data,
}: FlatListProps<NFTMetadata["properties"][number]>) {
  const dataWithAdd = data.concat(ADD_NEW);
  return (
    <FlatList
      numColumns={2}
      data={dataWithAdd}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
    />
  );
}
