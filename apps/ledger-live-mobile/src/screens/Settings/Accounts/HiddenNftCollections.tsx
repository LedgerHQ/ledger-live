import React, { useCallback, useMemo, useState } from "react";
import { FlatList } from "react-native";
import { Box, Flex, Text, IconsLegacy } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { Account, NFTMetadata } from "@ledgerhq/types-live";
import { useNftCollectionMetadata, useNftMetadata } from "@ledgerhq/live-nft-react";
import { TouchableOpacity } from "react-native-gesture-handler";
import styled from "styled-components/native";
import { NFTResource, NFTResourceLoaded, NftStatus } from "@ledgerhq/live-nft/types";
import { accountSelector } from "~/reducers/accounts";
import NftMedia from "~/components/Nft/NftMedia";
import Skeleton from "~/components/Skeleton";
import { updateNftStatus } from "~/actions/settings";
import { State } from "~/reducers/types";
import { nftCollectionsStatusByNetworkSelector } from "~/reducers/settings";
import { BlockchainEVM, BlockchainsType } from "@ledgerhq/live-nft/supported";
import { useTranslation } from "react-i18next";

const CollectionFlatList = styled(FlatList)`
  min-height: 100%;
` as unknown as typeof FlatList;

const CollectionImage = styled(NftMedia)`
  border-radius: 4px;
  width: 36px;
  aspect-ratio: 1;
  overflow: hidden;
`;

const CollectionNameSkeleton = styled(Skeleton)`
  height: 8px;
  width: 113px;
  border-radius: 4px;
  margin-left: 10px;
`;

const MAX_COLLECTIONS_FIRST_RENDER = 20;
const COLLECTIONS_TO_ADD_ON_LIST_END_REACHED = 10;

const HiddenNftCollectionRow = ({
  contractAddress,
  accountId,
  onUnhide,
}: {
  contractAddress: string;
  accountId: string;
  onUnhide: () => void;
}) => {
  const account = useSelector<State, Account | undefined>(state =>
    accountSelector(state, { accountId }),
  );
  const nfts = account?.nfts || [];
  const nft = nfts.find(nft => nft?.contract === contractAddress);

  const { status: collectionStatus, metadata: collectionMetadata } = useNftCollectionMetadata(
    contractAddress,
    nft?.currencyId,
  ) as NFTResource & { metadata?: NFTResourceLoaded["metadata"] };
  const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
    contractAddress,
    nft?.tokenId,
    nft?.currencyId,
  ) as NFTResource & { metadata?: NFTResourceLoaded["metadata"] };
  const loading = useMemo(
    () => nftStatus === "loading" || collectionStatus === "loading",
    [collectionStatus, nftStatus],
  );

  return (
    <Flex p={6} flexDirection="row" alignItems="center">
      <CollectionImage
        status={nftStatus}
        metadata={nftMetadata as NFTMetadata}
        mediaFormat={"preview"}
      />
      <Flex flexDirection="row" alignItems="center" flexShrink={1} justifyContent="space-between">
        <Flex mx={6} flexGrow={1} flexShrink={1} flexDirection="column">
          <CollectionNameSkeleton loading={loading}>
            <Text fontWeight={"semiBold"} variant={"large"} ellipsizeMode="tail" numberOfLines={2}>
              {collectionMetadata?.tokenName || contractAddress}
            </Text>
          </CollectionNameSkeleton>
        </Flex>
        {!loading && (
          <TouchableOpacity onPress={onUnhide}>
            <IconsLegacy.CloseMedium color="neutral.c100" size={24} />
          </TouchableOpacity>
        )}
      </Flex>
    </Flex>
  );
};

const HiddenNftCollections = () => {
  const collections = useSelector(nftCollectionsStatusByNetworkSelector);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [collectionsCount, setCollectionsCount] = useState(MAX_COLLECTIONS_FIRST_RENDER);

  const onUnhideCollection = useCallback(
    (collectionId: string, blockchain: BlockchainsType) => {
      dispatch(
        updateNftStatus({ blockchain, collection: collectionId, status: NftStatus.whitelisted }),
      );
    },
    [dispatch],
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      const [accountId, contractAddress] = item.split("|");
      const network = (Object.keys(collections).find(
        key => collections[key as BlockchainEVM][item],
      ) ?? BlockchainEVM.Ethereum) as BlockchainsType;
      return (
        <HiddenNftCollectionRow
          accountId={accountId}
          contractAddress={contractAddress}
          onUnhide={() => onUnhideCollection(item, network)}
        />
      );
    },
    [collections, onUnhideCollection],
  );

  const keyExtractor = useCallback((item: string) => item, []);

  const hiddenNftCollections = useMemo(
    () =>
      Object.values(collections).flatMap(network =>
        Object.keys(network).filter(
          collection =>
            network[collection] === NftStatus.blacklisted || network[collection] === NftStatus.spam,
        ),
      ),
    [collections],
  );

  const collectionsSliced: string[] = useMemo(
    () => hiddenNftCollections.slice(0, collectionsCount),
    [collectionsCount, hiddenNftCollections],
  );

  const onEndReached = useCallback(() => {
    setCollectionsCount(collectionsCount + COLLECTIONS_TO_ADD_ON_LIST_END_REACHED);
  }, [collectionsCount]);

  return (
    <Box backgroundColor={"background.main"} height={"100%"}>
      <Flex p={2}>
        <CollectionFlatList
          data={collectionsSliced}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={onEndReached}
          ListEmptyComponent={() => (
            <Flex p={6} alignItems="center">
              <Text variant="bodyLineHeight">{t("wallet.nftGallery.filters.empty")}</Text>
            </Flex>
          )}
        />
      </Flex>
    </Box>
  );
};

export default HiddenNftCollections;
