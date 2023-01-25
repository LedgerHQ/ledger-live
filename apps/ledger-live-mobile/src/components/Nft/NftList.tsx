import React, { useCallback } from "react";
import { FlatListProps, TouchableOpacity } from "react-native";
import { ProtoNFT } from "@ledgerhq/types-live";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";
import { Stop } from "react-native-svg";
import styled, { useTheme } from "styled-components/native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import NftListItem from "./NftListItem";
import { AddNewItem } from "./AddNewItemList";
import CollapsibleHeaderFlatList from "../WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "../globalSyncRefreshControl";
import { TrackScreen } from "../../analytics";
import { useNftList } from "./NftList.hook";
import BackgroundGradient from "../TabBar/BackgroundGradient";

const darkGradients = [
  {
    height: 130,
    opacity: 1,
    stops: [
      <Stop key="0%" offset="0%" stopOpacity={0} stopColor="#131214" />,
      <Stop key="50%" offset="50%" stopOpacity={1} stopColor="#131214" />,
    ],
  },
];

const lightGradients = [
  {
    height: 130,
    opacity: 1,
    stops: [
      <Stop key="0%" offset="0%" stopOpacity={0} stopColor="#ffffff" />,
      <Stop key="50%" offset="50%" stopOpacity={1} stopColor="#ffffff" />,
    ],
  },
];

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
  const { space, colors } = useTheme();
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
          <>{!onMultiSelectMode && <AddNewItem />}</>
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

  const gradients = colors.type === "light" ? lightGradients : darkGradients;
  return (
    <>
      <TrackScreen category="NFT Gallery" NFTs_owned={data.length} />

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
                    <Text variant="body" fontWeight="semiBold">
                      {t("wallet.nftGallery.filters.selectAndHide")}
                    </Text>
                  </StyledButton>
                </Flex>
              </Animated.View>
            )}
          </Animated.View>
        }
        ListHeaderComponentStyle={{
          marginBottom: onMultiSelectMode ? 0 : space[6],
        }}
        data={dataWithAdd}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={11}
        contentContainerStyle={{ marginTop: 0, marginHorizontal: space[6] }}
        testID={"wallet-nft-gallery-list"}
      />
      <Animated.View>
        {onMultiSelectMode && (
          <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
            <BackgroundGradient {...gradients[0]} />
            <BackgroundGradient {...gradients[1]} />
            <ButtonsContainer width="100%" justifyContent={"space-between"}>
              <StyledButton
                onPress={onClickHide}
                type="main"
                iconName="EyeNone"
                iconPosition="left"
                size="medium"
                flexGrow={1}
                disabled={nftsToHide.length === 0}
              >
                {t("wallet.nftGallery.filters.hide", {
                  count: nftsToHide.length,
                })}
              </StyledButton>
              <StyledButton
                onPress={readOnlyModeAction}
                type="default"
                iconPosition="left"
                size="medium"
                flexGrow={1}
              >
                {t("common.cancel")}
              </StyledButton>
            </ButtonsContainer>
          </Animated.View>
        )}
      </Animated.View>
    </>
  );
}

const StyledButton = styled(Button)`
  padding: 0;
  margin: 0;
`;

const ButtonsContainer = styled(Flex)`
  position: absolute;
  bottom: 20px;
  z-index: 5;
  padding: 0 18px;
`;
