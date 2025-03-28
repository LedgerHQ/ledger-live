import React, { useCallback, useMemo, useState } from "react";

import { Box, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, View, FlatList } from "react-native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { nftsByCollections } from "@ledgerhq/live-nft";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { ChevronRightMedium, PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import NftCollectionOptionsMenu from "~/components/Nft/NftCollectionOptionsMenu";

import NftCollectionRow from "~/components/Nft/NftCollectionRow";
import { NavigatorName, ScreenName } from "~/const";
import Button from "~/components/wrappedUi/Button";
import Touchable from "~/components/Touchable";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useNftGalleryFilter, getThreshold } from "@ledgerhq/live-nft-react";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";

const MAX_COLLECTIONS_TO_SHOW = 3;

type Props = {
  account: Account;
};

export default function NftCollectionsList({ account }: Props) {
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const threshold = nftsFromSimplehashFeature?.params?.threshold;
  const nftsFromSimplehashEnabled = nftsFromSimplehashFeature?.enabled || false;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { nfts, isLoading } = useNftGalleryFilter({
    nftsOwned: account.nfts || [],
    addresses: account.freshAddress,
    chains: [account.currency.id],
    threshold: getThreshold(threshold),
    enabled: nftsFromSimplehashEnabled,
    staleTime: nftsFromSimplehashFeature?.params?.staleTime,
  });

  const { hiddenNftCollections } = useNftCollectionsStatus();

  const nftCollections = useMemo(
    () =>
      Object.entries(nftsByCollections(nftsFromSimplehashEnabled ? nfts : account.nfts)).filter(
        ([contract]) => !hiddenNftCollections.includes(`${account.id}|${contract}`),
      ),
    [account.id, account.nfts, hiddenNftCollections, nfts, nftsFromSimplehashEnabled],
  ) as [string, ProtoNFT[]][];

  const [isCollectionMenuOpen, setIsCollectionMenuOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ProtoNFT[]>();

  const onSelectCollection = useCallback(
    (collection: ProtoNFT[]) => {
      setSelectedCollection(collection);
      setIsCollectionMenuOpen(true);
    },
    [setSelectedCollection, setIsCollectionMenuOpen],
  );

  const data = useMemo(
    () => nftCollections.slice(0, MAX_COLLECTIONS_TO_SHOW).map(([, collection]) => collection),
    [nftCollections],
  );

  const navigateToReceive = useCallback(
    () =>
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveConfirmation,
        params: {
          accountId: account.id,
        },
      }),
    [account.id, navigation],
  );

  const navigateToCollection = useCallback(
    (collection: ProtoNFT[]) =>
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.NftCollection,
        params: {
          collection,
          accountId: account.id,
        },
      }),
    [account.id, navigation],
  );

  const navigateToGallery = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.NftGallery,
      params: {
        title: t("nft.gallery.allNft"),
        accountId: account.id,
      },
    });
  }, [account.id, navigation, t]);

  const navigateToReceiveConnectDevice = useCallback(() => {
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        accountId: account.id,
      },
    });
  }, [account.id, navigation]);

  const renderHeader = useCallback(
    () => (
      <SectionTitle
        title={"NFT"}
        seeMoreText={t("account.nft.receiveNft")}
        onSeeAllPress={data.length ? navigateToReceive : undefined}
        containerProps={{ mb: 6 }}
      />
    ),
    [data.length, navigateToReceive, t],
  );

  const renderFooter = useCallback(
    () =>
      isLoading ? (
        <InfiniteLoader />
      ) : data.length ? (
        <Button
          type={"shade"}
          size={"small"}
          outline
          onPress={navigateToGallery}
          Icon={ChevronRightMedium}
          mt={3}
        >
          <Trans i18nKey="nft.account.seeAllNfts" />
        </Button>
      ) : (
        <Touchable event="AccountReceiveSubAccount" onPress={navigateToReceiveConnectDevice}>
          <View
            style={[
              styles.footer,
              {
                borderColor: colors.fog,
              },
            ]}
          >
            <PlusMedium color={"primary.c80"} size={26} />
            <View style={styles.footerText}>
              <Text variant={"large"}>
                <Trans i18nKey={`account.nft.howTo`} values={{ currency: account.currency.family }}>
                  <Text variant={"large"} fontWeight={"semiBold"}>
                    PLACEHOLDER_TEXT
                  </Text>
                  <Text variant={"large"} fontWeight={"semiBold"}>
                    PLACEHOLDER_TEXT
                  </Text>
                </Trans>
              </Text>
            </View>
          </View>
        </Touchable>
      ),
    [
      account.currency.family,
      colors.fog,
      data.length,
      isLoading,
      navigateToGallery,
      navigateToReceiveConnectDevice,
    ],
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
          onLongPress={() => onSelectCollection(item)}
        />
      </Box>
    ),
    [data.length, navigateToCollection, onSelectCollection],
  );

  return (
    <View>
      <FlatList
        data={data}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />

      {selectedCollection && (
        <NftCollectionOptionsMenu
          isOpen={isCollectionMenuOpen}
          collection={selectedCollection}
          onClose={() => setIsCollectionMenuOpen(false)}
          account={account}
        />
      )}
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
  footer: {
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  footerText: {
    flex: 1,
    flexShrink: 1,
    flexWrap: "wrap",
    paddingLeft: 12,
    flexDirection: "row",
  },
  subAccountList: {
    paddingTop: 32,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 24,
  },
});
