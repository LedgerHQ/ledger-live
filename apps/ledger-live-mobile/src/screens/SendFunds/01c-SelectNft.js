// @flow
import React, { useCallback, useMemo, useState, memo } from "react";

import { BigNumber } from "bignumber.js";
import { useNftMetadata } from "@ledgerhq/live-common/lib/nft";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from "react-native";

import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NFT, CollectionWithNFT } from "@ledgerhq/live-common/lib/nft";

import LoadingFooter from "../../components/LoadingFooter";
import NftImage from "../../components/Nft/NftImage";
import Skeleton from "../../components/Skeleton";
import LText from "../../components/LText";
import { ScreenName } from "../../const";

const MAX_NFTS_FIRST_RENDER = 8;
const NFTS_TO_ADD_ON_LIST_END_REACHED = 8;

const NftRow = memo(
  ({
    account,
    collection,
    nft,
  }: {
    account: Account,
    collection: CollectionWithNFT,
    nft: NFT,
  }) => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { status, metadata } = useNftMetadata(
      collection.contract,
      nft.tokenId,
    );

    const goToRecipientSelection = useCallback(() => {
      const bridge = getAccountBridge(account);

      let transaction = bridge.createTransaction(account);
      transaction = bridge.updateTransaction(transaction, {
        tokenIds: [nft.tokenId],
        quantities: [BigNumber(1)],
        collection: collection.contract,
        mode: `${collection.standard?.toLowerCase()}.transfer`,
      });

      navigation.navigate(ScreenName.SendSelectRecipient, {
        accountId: account.id,
        parentId: account.parentId,
        transaction,
      });
    }, [account, nft, collection, navigation]);

    return (
      <TouchableOpacity style={styles.nftRow} onPress={goToRecipientSelection}>
        <View style={styles.nftImageContainer}>
          <NftImage
            style={styles.nftImage}
            src={metadata?.media}
            status={status}
          />
        </View>
        <View style={styles.nftNameContainer}>
          <Skeleton
            style={[styles.nftNameSkeleton, styles.nftName]}
            loading={status === "loading"}
          >
            <LText
              style={styles.nftName}
              semiBold
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {metadata?.nftName || "-"}
            </LText>
          </Skeleton>
          <LText
            numberOfLines={1}
            ellipsizeMode="middle"
            style={[styles.tokenId, { color: colors.grey }]}
          >
            ID {nft.tokenId}
          </LText>
        </View>
        {collection?.standard === "ERC1155" ? (
          <View style={styles.amount}>
            <LText numberOfLines={1} style={{ color: colors.grey }}>
              x{nft.amount.toFixed()}
            </LText>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  },
);

const keyExtractor = (nft: NFT) => nft?.tokenId;

type Props = {
  route: {
    params: {
      account: Account,
      collection: CollectionWithNFT,
    },
  },
};

const SendFundsSelectNft = ({ route }: Props) => {
  const { params } = route;
  const { account, collection } = params;
  const { colors } = useTheme();

  const [nftCount, setNftCount] = useState(MAX_NFTS_FIRST_RENDER);
  const nftsSlice = useMemo(() => collection?.nfts?.slice(0, nftCount) || [], [
    collection.nfts,
    nftCount,
  ]);
  const onEndReached = useCallback(
    () => setNftCount(nftCount + NFTS_TO_ADD_ON_LIST_END_REACHED),
    [nftCount, setNftCount],
  );

  const renderItem = useCallback(
    ({ item }: { item: NFT }) => (
      <NftRow account={account} collection={collection} nft={item} />
    ),
    [account, collection],
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={{ bottom: "always" }}
    >
      <FlatList
        contentContainerStyle={styles.nfts}
        data={nftsSlice}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        ListFooterComponent={
          nftCount < collection.nfts?.length ? <LoadingFooter /> : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  nfts: {
    paddingBottom: 32,
  },
  nftRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  nftImageContainer: {
    flexGrow: 0,
    width: 48,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: {
          height: 2,
        },
      },
    }),
  },
  nftImage: {
    height: 48,
    width: 48,
    borderRadius: 4,
    overflow: "hidden",
  },
  nftNameContainer: {
    flex: 1,
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  nftNameSkeleton: {
    height: 12,
    borderRadius: 4,
    fontSize: 15,
  },
  nftName: {
    textTransform: "uppercase",
  },
  tokenId: {
    fontSize: 13,
  },
  amount: {
    fontSize: 14,
    maxWidth: 80,
    minWidth: 30,
    paddingHorizontal: 4,
    alignItems: "flex-end",
  },
});

export default SendFundsSelectNft;
