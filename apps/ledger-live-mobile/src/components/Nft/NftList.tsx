import React, { useCallback, useMemo } from "react";
import { ListRenderItemInfo } from "react-native";
import { ProtoNFT } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";
import NftListItem from "./NftListItem";
import { AddNewItem } from "./AddNewItemList";
import CollapsibleHeaderFlatList from "../WalletTab/CollapsibleHeaderFlatList";

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
  count,
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
    mr={(index + 1) % NB_COLUMNS > 0 ? 4 : 0}
  >
    {item.id === ADD_NEW.id ? (
      <AddNewItem />
    ) : (
      <NftListItem nft={item} ownedNftsInCollection={count} />
    )}
  </Flex>
);

const keyExtractor = (item: ProtoNFT) => item.id;

export function NftList({ data }: Props) {
  const dataWithAdd = data.concat(ADD_NEW);

  const groupedContracts = useMemo(
    () =>
      dataWithAdd.reduce(
        (acc, e) => acc.set(e.contract, (acc.get(e.contract) || 0) + 1),
        new Map<string, number>(),
      ),
    [dataWithAdd],
  );

  const getNbItemsOfCollection = useCallback(
    (contract: string) => groupedContracts.get(contract),
    [groupedContracts],
  );

  const renderElem = useCallback(
    (elem: ListRenderItemInfo<ProtoNFT>) =>
      renderItem({
        ...elem,
        count:
          elem.item.standard === "ERC1155"
            ? getNbItemsOfCollection(elem.item.contract)
            : undefined,
      }),
    [getNbItemsOfCollection],
  );

  return (
    <CollapsibleHeaderFlatList
      numColumns={2}
      data={dataWithAdd}
      renderItem={renderElem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
    />
  );
}
