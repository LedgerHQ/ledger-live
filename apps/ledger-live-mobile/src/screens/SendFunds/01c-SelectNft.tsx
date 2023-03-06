import React, { useCallback, useMemo, useState, memo } from "react";

import {
  useNftMetadata,
  getNftCapabilities,
} from "@ledgerhq/live-common/nft/index";
import { BigNumber } from "bignumber.js";
import { useNavigation, useTheme } from "@react-navigation/native";
import {
  Account,
  NFTCollectionMetadataResponse,
  NFTMetadataResponse,
  ProtoNFT,
  TokenAccount,
} from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import LoadingFooter from "../../components/LoadingFooter";
import NftMedia from "../../components/Nft/NftMedia";
import Skeleton from "../../components/Skeleton";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import { StackNavigatorNavigation } from "../../components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";

const MAX_NFTS_FIRST_RENDER = 8;
const NFTS_TO_ADD_ON_LIST_END_REACHED = 8;

const NftRow = memo(
  ({ account, nft }: { account: Account | TokenAccount; nft: ProtoNFT }) => {
    const { t } = useTranslation();
    const navigation =
      useNavigation<
        StackNavigatorNavigation<
          SendFundsNavigatorStackParamList,
          ScreenName.SendNft
        >
      >();
    const { colors } = useTheme();
    const { status, metadata } = useNftMetadata(
      nft?.contract,
      nft?.tokenId,
      nft?.currencyId,
    ) as {
      status: NFTResource["status"];
      metadata?: NFTMetadataResponse["result"] &
        NFTCollectionMetadataResponse["result"];
    };

    const nftCapabilities = useMemo(() => getNftCapabilities(nft), [nft]);

    const goToRecipientSelection = useCallback(() => {
      const bridge = getAccountBridge(account);

      let transaction = bridge.createTransaction(account);
      transaction = bridge.updateTransaction(transaction, {
        tokenIds: [nft?.tokenId],
        // Quantity is set to null first to allow the user to change it on the amount page
        quantities: [nftCapabilities.hasQuantity ? null : new BigNumber(1)],
        collection: nft?.contract,
        mode: `${nft?.standard?.toLowerCase()}.transfer`,
      });

      navigation.navigate(ScreenName.SendSelectRecipient, {
        accountId: account.id,
        parentId: (account as TokenAccount).parentId,
        transaction,
      });
    }, [account, nft, nftCapabilities.hasQuantity, navigation]);

    return (
      <TouchableOpacity style={styles.nftRow} onPress={goToRecipientSelection}>
        <View style={styles.nftImageContainer}>
          <NftMedia
            style={styles.nftImage}
            metadata={metadata}
            status={status}
            mediaFormat={"preview"}
          />
        </View>
        <View style={styles.nftNameContainer}>
          <Skeleton
            style={[styles.nftNameSkeleton]}
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
            {t("common.patterns.id", { value: nft?.tokenId })}
          </LText>
        </View>
        {nft?.standard === "ERC1155" ? (
          <View style={styles.amount}>
            <LText numberOfLines={1} style={{ color: colors.grey }}>
              {t("common.patterns.times", { value: nft?.amount?.toFixed() })}
            </LText>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  },
);

const keyExtractor = (nft: ProtoNFT) => nft?.tokenId;

type Props = {
  route: {
    params: {
      account: Account;
      collection: ProtoNFT[];
    };
  };
};

const SendFundsSelectNft = ({ route }: Props) => {
  const { params } = route;
  const { account, collection } = params;
  const { colors } = useTheme();

  const [nftCount, setNftCount] = useState(MAX_NFTS_FIRST_RENDER);
  const nftsSlice = useMemo(
    () => collection?.slice(0, nftCount) || [],
    [collection, nftCount],
  );
  const onEndReached = useCallback(
    () => setNftCount(nftCount + NFTS_TO_ADD_ON_LIST_END_REACHED),
    [nftCount, setNftCount],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProtoNFT }) => <NftRow account={account} nft={item} />,
    [account],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        contentContainerStyle={styles.nfts}
        data={nftsSlice}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        ListFooterComponent={
          nftCount < collection?.length ? <LoadingFooter /> : null
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
          width: 0,
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

export default memo<Props>(SendFundsSelectNft);
