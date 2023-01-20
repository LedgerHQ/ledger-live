import React, { useCallback } from "react";
import { FlatListProps, TouchableOpacity } from "react-native";
import { ProtoNFT } from "@ledgerhq/types-live";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";

import styled from "styled-components/native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import NftListItem from "./NftListItem";
import { AddNewItem } from "./AddNewItemList";
import CollapsibleHeaderFlatList from "../WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "../globalSyncRefreshControl";
import { TrackScreen } from "../../analytics";
import { useNftList } from "./NftList.hook";
import Close from "../../icons/Close";

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
    t,
    multiSelectModeAction,
    navigateToNftViewer,
    onClickHide,
    readOnlyModeAction,
    updateListSelect,
    nftsToHide,
    onMultiSelectMode,
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
              onMultiSelectMode
                ? updateListSelect(item)
                : navigateToNftViewer(item)
            }
            onLongPress={() => {
              multiSelectModeAction();
              updateListSelect(item);
            }}
            selectable={onMultiSelectMode}
            isSelected={nftsToHide.includes(item)}
          />
        )}
      </Flex>
    ),
    [
      multiSelectModeAction,
      navigateToNftViewer,
      nftsToHide,
      onMultiSelectMode,
      updateListSelect,
    ],
  );

  return (
    <>
      <TrackScreen category="NFT Gallery" NFTs_owned={data.length} />

      {onMultiSelectMode && (
        <StyledContainer
          width="100%"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          bg={"background.drawer"}
        >
          <Text
            variant={"large"}
            fontWeight={"semiBold"}
            color={"neutral.c100"}
          >
            {t("wallet.nftGallery.filters.title", { count: nftsToHide.length })}
          </Text>
          <TouchableOpacity onPress={readOnlyModeAction}>
            <Close size={24} color={"white"} />
          </TouchableOpacity>
        </StyledContainer>
      )}

      <RefreshableCollapsibleHeaderFlatList
        numColumns={2}
        ListHeaderComponent={
          <Animated.View>
            {!onMultiSelectMode && (
              <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
                <Flex
                  width="100%"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="flex-start"
                >
                  <StyledButton
                    onPress={multiSelectModeAction}
                    type="default"
                    iconName="Tasks"
                    iconPosition="left"
                    size="small"
                  >
                    {t("wallet.nftGallery.filters.selectAndHide")}
                  </StyledButton>
                </Flex>
              </Animated.View>
            )}
          </Animated.View>
        }
        data={dataWithAdd}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={11}
        contentContainerStyle={{ marginTop: 0, marginHorizontal: 18 }}
        testID={"wallet-nft-gallery-list"}
      />

      {nftsToHide.length > 0 && onMultiSelectMode && (
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
  top: 0;
  z-index: 10;
  padding: 50px 18px 10px 18px;
`;

const RoundedContainer = styled(Flex)`
  position: absolute;
  bottom: 15px;
  z-index: 5;
  padding: 0 18px;
`;
