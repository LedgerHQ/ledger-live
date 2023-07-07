import React, { useCallback, useMemo, useState, memo } from "react";
import BigNumber from "bignumber.js";
import { useNftMetadata, getNftCapabilities } from "@ledgerhq/live-common/nft/index";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { View, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
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

const NftRow = memo(({ account, nft }: { account: Account; nft: ProtoNFT }) => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<StackNavigatorNavigation<SendFundsNavigatorStackParamList, ScreenName.SendNft>>();
  const { colors } = useTheme();
  const { status, metadata } = useNftMetadata(nft?.contract, nft?.tokenId, nft?.currencyId);

  const nftCapabilities = useMemo(() => getNftCapabilities(nft), [nft]);

  const goToRecipientSelection = useCallback(() => {
    const bridge = getAccountBridge(account);

    const defaultTransaction = bridge.createTransaction(account);
    let transaction;
    if (account.currency.family === "evm") {
      transaction = bridge.updateTransaction(defaultTransaction, {
        nft: {
          contract: nft?.contract,
          tokenId: nft?.tokenId,
          // When available, quantity is set to Infinity (considered null) first for
          // the next UI. It allows the user to not have a default value during
          // the first screen, like 0 or 1, which could trigger an error
          quantities: nftCapabilities.hasQuantity ? new BigNumber(Infinity) : new BigNumber(1),
          mode: `${nft?.standard?.toLowerCase()}`,
        },
      });
    } else if (account.currency.family === "ethereum") {
      transaction = bridge.updateTransaction(defaultTransaction, {
        tokenIds: [nft?.tokenId],
        // When available, quantity is set to null first for the next UI.
        // It allows the user to not have a default value during the
        // first screen, like 0 or 1, which could trigger an error
        quantities: [nftCapabilities.hasQuantity ? null : new BigNumber(1)],
        collection: nft?.contract,
        mode: `${nft?.standard?.toLowerCase()}.transfer`,
      });
    }

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
