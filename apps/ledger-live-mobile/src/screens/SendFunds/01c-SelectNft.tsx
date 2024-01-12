import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getNftCapabilities, useNftMetadata } from "@ledgerhq/live-common/nft/index";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useNavigation, useTheme } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LText from "~/components/LText";
import LoadingFooter from "~/components/LoadingFooter";
import NftMedia from "~/components/Nft/NftMedia";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import Skeleton from "~/components/Skeleton";
import { ScreenName } from "~/const";

const MAX_NFTS_FIRST_RENDER = 8;
const NFTS_TO_ADD_ON_LIST_END_REACHED = 8;

const NftRow = memo(({ account, nft }: { account: Account; nft: ProtoNFT }) => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<StackNavigatorNavigation<SendFundsNavigatorStackParamList, ScreenName.SendNft>>();
  const { colors } = useTheme();
  const { status, metadata } = useNftMetadata(nft?.contract, nft?.tokenId, nft?.currencyId);

  const nftCapabilities = useMemo(() => getNftCapabilities(nft), [nft]);

  const goToRecipientSelection = useCallback(() => {
    // Only evm family handles nft as of today. If later we have other family,
    // we will need to rework the NFT send flow by implementing family specific
    // logic under their "src/families" respective folder.
    const bridge = getAccountBridge<EvmTransaction>(account);

    const defaultTransaction = bridge.createTransaction(account);

    const nftTxPatch: Partial<EvmTransaction> = {
      nft: {
        contract: nft?.contract,
        tokenId: nft?.tokenId,
        // When available, quantity is set to Infinity (considered null) first for
        // the next UI. It allows the user to not have a default value during
        // the first screen, like 0 or 1, which could trigger an error
        quantity: nftCapabilities.hasQuantity ? new BigNumber(Infinity) : new BigNumber(1),
        // collectionName defaults to empty string since it is unknown at this stage
        // and set by `prepareNftTransaction` after being fetched from the
        // Collection Metadata service
        // cf. libs/coin-evm/src/prepareTransaction.ts
        collectionName: "",
      },
      mode: `${nft?.standard?.toLowerCase()}` as "erc721" | "erc1155",
    };

    const transaction = bridge.updateTransaction(defaultTransaction, nftTxPatch);

    navigation.navigate(ScreenName.SendSelectRecipient, {
      accountId: account.id,
      transaction,
    });
  }, [
    account,
    navigation,
    nft?.contract,
    nft?.tokenId,
    nft?.standard,
    nftCapabilities.hasQuantity,
  ]);

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
        <Skeleton style={[styles.nftNameSkeleton]} loading={status === "loading"}>
          <LText style={styles.nftName} semiBold numberOfLines={1} ellipsizeMode="tail">
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
      {nftCapabilities.hasQuantity ? (
        <View style={styles.amount}>
          <LText numberOfLines={1} style={{ color: colors.grey }}>
            {t("common.patterns.times", { value: nft?.amount?.toFixed() })}
          </LText>
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

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
  const nftsSlice = useMemo(() => collection?.slice(0, nftCount) || [], [collection, nftCount]);
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
        ListFooterComponent={nftCount < collection?.length ? <LoadingFooter /> : null}
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
