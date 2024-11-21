import React, { useCallback, useMemo, useState } from "react";
import { FlatList } from "react-native";
import { Box, Flex, Text, IconsLegacy } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { Account, NFTMetadata } from "@ledgerhq/types-live";
import { useNftCollectionMetadata, useNftMetadata } from "@ledgerhq/live-nft-react";
import { TouchableOpacity } from "react-native-gesture-handler";
import styled from "styled-components/native";
import { NFTResource, NFTResourceLoaded } from "@ledgerhq/live-nft/types";
import { hiddenNftCollectionsSelector } from "~/reducers/settings";
import { accountSelector } from "~/reducers/accounts";
import NftMedia from "~/components/Nft/NftMedia";
import Skeleton from "~/components/Skeleton";
import { unhideNftCollection, whitelistNftCollection } from "~/actions/settings";
import { State } from "~/reducers/types";

const MAX_COLLECTIONS_FIRST_RENDER = 10;
const COLLECTIONS_TO_ADD_ON_LIST_END_REACHED = 6;

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
        <TouchableOpacity onPress={onUnhide}>
          <IconsLegacy.CloseMedium color="neutral.c100" size={24} />
        </TouchableOpacity>
      </Flex>
    </Flex>
  );
};

const HiddenNftCollections = () => {
  const hiddenCollections = useSelector(hiddenNftCollectionsSelector);
  const dispatch = useDispatch();

  const [collectionsCount, setCollectionsCount] = useState(MAX_COLLECTIONS_FIRST_RENDER);

  const onUnhideCollection = useCallback(
    (collectionId: string) => {
      dispatch(unhideNftCollection(collectionId));
      dispatch(whitelistNftCollection(collectionId));
    },
    [dispatch],
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      const [accountId, contractAddress] = item.split("|");
      return (
        <HiddenNftCollectionRow
          accountId={accountId}
          contractAddress={contractAddress}
          onUnhide={() => onUnhideCollection(item)}
        />
      );
    },
    [onUnhideCollection],
  );

  const keyExtractor = useCallback((item: string) => item, []);

  const collectionsSliced: string[] = useMemo(
    () => hiddenCollections.slice(0, collectionsCount),
    [collectionsCount, hiddenCollections],
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
        />
      </Flex>
    </Box>
  );
};

export default HiddenNftCollections;
