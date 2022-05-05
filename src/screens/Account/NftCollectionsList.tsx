import React, { useCallback, useMemo } from "react";

import take from "lodash/take";
import { Trans, useTranslation } from "react-i18next";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { nftsByCollections } from "@ledgerhq/live-common/lib/nft";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, View, FlatList } from "react-native";
import { Account, ProtoNFT } from "@ledgerhq/live-common/lib/types";
import { Box, Text } from "@ledgerhq/native-ui";
import {
  ArrowBottomMedium,
  DroprightMedium,
} from "@ledgerhq/native-ui/assets/icons";
import NftCollectionRow from "../../components/Nft/NftCollectionRow";
import { NavigatorName, ScreenName } from "../../const";
import Button from "../../components/wrappedUi/Button";
import Link from "../../components/wrappedUi/Link";

const MAX_COLLECTIONS_TO_SHOW = 3;

type Props = {
  account: Account;
};

export default function NftCollectionsList({ account }: Props) {
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");

  const { t } = useTranslation();
  const navigation = useNavigation();
  const { nfts } = account;
  const nftCollections = useMemo(() => nftsByCollections(nfts), [
    nfts,
  ]) as Record<string, ProtoNFT[]>;
  const data = useMemo(
    () => take(Object.values(nftCollections), MAX_COLLECTIONS_TO_SHOW),
    [nftCollections],
  );

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

  const navigateToCollection = useCallback(
    collection =>
      navigation.navigate(ScreenName.NftCollection, {
        collection,
        accountId: account.id,
      }),
    [account.id, navigation],
  );

  const navigateToGallery = useCallback(() => {
    navigation.navigate(ScreenName.NftGallery, {
      title: t("nft.gallery.allNft"),
      accountId: account.id,
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
    [navigateToGallery],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProtoNFT[]; index: number }) => (
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

  return (
    <View style={styles.collectionList}>
      <FlatList
        data={data}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
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
