import React, { useCallback, useMemo } from "react";

import take from "lodash/take";
import { Trans, useTranslation } from "react-i18next";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { nftsByCollections } from "@ledgerhq/live-common/lib/nft";
import { useNavigation, useTheme } from "@react-navigation/native";
import { StyleSheet, View, FlatList } from "react-native";

import { Account } from "@ledgerhq/live-common/lib/types";

import { Box, Text } from "@ledgerhq/native-ui";
import {
  ArrowBottomMedium,
  DroprightMedium,
} from "@ledgerhq/native-ui/assets/icons";
import NftCollectionRow from "../../components/Nft/NftCollectionRow";
import { NavigatorName, ScreenName } from "../../const";
import Link from "../../components/wrappedUi/Link";
import Button from "../../components/wrappedUi/Button";

const MAX_COLLECTIONS_TO_SHOW = 3;

const collectionKeyExtractor = (o: any) => o.contract;

type Props = {
  account: Account;
};

export default function NftCollectionsList({ account }: Props) {
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");

  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { nfts } = account;
  const nftCollections = useMemo(() => nftsByCollections(nfts), [nfts]);
  const data = take(nftCollections, MAX_COLLECTIONS_TO_SHOW);

  const navigateToReceive = useCallback(
    () =>
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveConnectDevice,
        params: {
          accountId: account.id,
        },
      }),
    [account.id, navigation],
  );

  // Forced to use useCallback here to avoid a non sensical warning...
  const navigateToCollection = useCallback(
    collection =>
      navigation.navigate(NavigatorName.PortfolioAccounts, {
        screen: ScreenName.NftCollection,
        params: {
          collection,
          accountId: account.id,
        },
        initial: false,
      }),
    [account.id, navigation],
  );

  const navigateToGallery = useCallback(() => {
    navigation.navigate(NavigatorName.PortfolioAccounts, {
      screen: ScreenName.NftGallery,
      params: {
        title: t("nft.gallery.allNft"),
        accountId: account.id,
      },
      initial: false,
    });
  }, [account.id, navigation, t]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Text variant={"h3"}>NFT</Text>
        <Link
          type="color"
          event="AccountReceiveToken"
          Icon={ArrowBottomMedium}
          iconPosition={"left"}
          onPress={navigateToReceive}
        >
          <Trans i18nKey="account.nft.receiveNft" />
        </Link>
      </View>
    ),
    [navigateToReceive],
  );

  const renderFooter = useCallback(
    () => (
      <Button
        type={"shade"}
        size={"small"}
        outline
        onPress={navigateToGallery}
        Icon={DroprightMedium}
        mt={3}
      >
        <Trans i18nKey="nft.account.seeAllNfts" />
      </Button>
    ),
    [colors, navigateToGallery, nftCollections.length],
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <Box
        borderBottomWidth={data.length - 1 !== index ? "1px" : 0}
        borderBottomColor={"neutral.c40"}
      >
        <NftCollectionRow
          collection={item}
          onCollectionPress={() => navigateToCollection(item)}
        />
      </Box>
    ),
    [data.length, navigateToCollection],
  );

  const listFooterComponent = useMemo(
    () =>
      nftCollections.length > MAX_COLLECTIONS_TO_SHOW ? renderFooter : null,
    [nftCollections.length, renderFooter],
  );

  return (
    <View style={styles.collectionList}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={collectionKeyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={listFooterComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  collectionList: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 24,
  },
});
