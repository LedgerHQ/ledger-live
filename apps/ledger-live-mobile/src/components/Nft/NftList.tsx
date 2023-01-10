import React, { useCallback } from "react";
import { FlatListProps } from "react-native";
import { ProtoNFT } from "@ledgerhq/types-live";
import { Button, Flex } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";

import styled from "styled-components/native";
import NftListItem from "./NftListItem";
import { AddNewItem } from "./AddNewItemList";
import CollapsibleHeaderFlatList from "../WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "../globalSyncRefreshControl";
import { TrackScreen } from "../../analytics";
import { useNftList } from "./NftList.hook";

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
  const {
    triggerMultiSelectHideAction,
    navigateToNftViewer,
    nftsToHide,
    onClickHide,
    isMainNavigatorVisible,
    t,
    cancelAction,
    updateListSelect,
  } = useNftList();

  const renderItem = useCallback(
    ({ item, index }: { item: ProtoNFT; index: number; count?: number }) => (
      <Flex
        flex={
          item.id === ADD_NEW.id && (index + 1) % NB_COLUMNS !== 0
            ? 1 / NB_COLUMNS
            : 1
        }
        mr={(index + 1) % NB_COLUMNS > 0 ? 6 : 0}
        testID={"wallet-nft-gallery-list-item"}
      >
        {item.id === ADD_NEW.id ? (
          <AddNewItem />
        ) : (
          <NftListItem
            nft={item}
            onPress={() =>
              isMainNavigatorVisible
                ? navigateToNftViewer(item)
                : updateListSelect(item)
            }
            selectable={!isMainNavigatorVisible}
            isSelected={nftsToHide.includes(item)}
          />
        )}
      </Flex>
    ),
    [isMainNavigatorVisible, navigateToNftViewer, nftsToHide, updateListSelect],
  );

  return (
    <>
      <TrackScreen category="NFT Gallery" NFTs_owned={data.length} />

      {!isMainNavigatorVisible && (
        <StyledContainer
          width="100%"
          flexDirection="row"
          alignItems="center"
          justifyContent="flex-start"
        >
          <Button
            onPress={triggerMultiSelectHideAction}
            type="main"
            iconName="Close"
            iconPosition="left"
            size="small"
          >
            {t("common.cancel")}
          </Button>
        </StyledContainer>
      )}

      <RefreshableCollapsibleHeaderFlatList
        numColumns={2}
        ListHeaderComponent={
          <>
            {isMainNavigatorVisible && (
              <Flex
                width="100%"
                flexDirection="row"
                alignItems="center"
                justifyContent="flex-start"
              >
                <StyledButton
                  onPress={cancelAction}
                  type="default"
                  iconName="Tasks"
                  iconPosition="left"
                  size="small"
                >
                  {t("wallet.nftGallery.filters.selectAndHide")}
                </StyledButton>
              </Flex>
            )}
          </>
        }
        data={dataWithAdd}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={11}
        contentContainerStyle={{ marginTop: 0 }}
        testID={"wallet-nft-gallery-list"}
      />

      {nftsToHide.length > 0 && (
        <RoundedContainer width="100%">
          <StyledButton
            onPress={onClickHide}
            type="main"
            iconName="EyeNone"
            iconPosition="left"
            size="large"
          >
            {t("wallet.nftGallery.filters.hide", { count: nftsToHide.length })}
          </StyledButton>
        </RoundedContainer>
      )}
    </>
  );
}

const StyledButton = styled(Button)`
  padding: 0;
  margin: 0;
`;

const StyledContainer = styled(Flex)`
  position: absolute;
  top: 150;
  z-index: 5;
`;

const RoundedContainer = styled(Flex)`
  position: absolute;
  bottom: 10px;
  z-index: 5;
`;
