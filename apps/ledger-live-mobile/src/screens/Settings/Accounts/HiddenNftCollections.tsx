import React, { useCallback, useMemo, useState } from "react";
import { FlatList } from "react-native";
import { Box, Flex, Text, Icons } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { Account, NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import {
  useNftCollectionMetadata,
  useNftMetadata,
} from "@ledgerhq/live-common/nft/NftMetadataProvider/index";
import { TouchableOpacity } from "react-native-gesture-handler";
import styled from "styled-components/native";
import {
  NFTResource,
  NFTResourceLoaded,
} from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import { hiddenNftsSelector } from "../../../reducers/accounts";
import NftMedia from "../../../components/Nft/NftMedia";
import Skeleton from "../../../components/Skeleton";
import { unhideNftCollection } from "../../../actions/settings";
import useFloorPrice from "../../../hooks/useFloorPrice";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CurrencyIcon from "../../../components/CurrencyIcon";
import HiddenNftLinkPanel from "../../../components/Nft/HiddenNftLinkPanel";

const CollectionFlatList = styled(FlatList)`
  min-height: 100%;
  padding: ${props => props.theme.space[6]}px;
` as unknown as typeof FlatList;

const CollectionImage = styled(NftMedia)`
  border-radius: 4px;
  width: 48px;
  aspect-ratio: 1;
  overflow: hidden;
`;

const CollectionNameSkeleton = styled(Skeleton)`
  height: 16px;
  width: 113px;
  border-radius: 4px;
  margin-left: 10px;
`;

const RowRoot = styled(Flex)`
  background-color: ${props => props.theme.colors.opacityDefault.c05};
  border-radius: 12px;
  margin-bottom: ${props => props.theme.space[4]}px;
`;

// NOTE: The Crypto icon has so much whitespace it breaks the alignment
// of this price vertically against the image and also horizontally against
// the NFT title. This "fixes" it.
const RowPrice = styled(Flex)`
  margin-left: -6px;
  margin-bottom: -6px;
`;

const HiddenNftCollectionRow = ({ nft, onUnhide }: { nft: ProtoNFT; onUnhide: () => void }) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const { status: collectionStatus, metadata: collectionMetadata } = useNftCollectionMetadata(
    nft.contract,
    nft.currencyId,
  ) as NFTResource & { metadata?: NFTResourceLoaded["metadata"] };
  const { floorPriceCurrency, currency, floorPrice } = useFloorPrice(nft);
  const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
    nft.contract,
    nft.tokenId,
    nft.currencyId,
  ) as NFTResource & { metadata?: NFTResourceLoaded["metadata"] };
  const loading = useMemo(
    () => nftStatus === "loading" || collectionStatus === "loading",
    [collectionStatus, nftStatus],
  );

  return (
    <>
      <RowRoot p={6} flexDirection="row" alignItems="center">
        <CollectionImage
          status={nftStatus}
          metadata={nftMetadata as NFTMetadata}
          mediaFormat={"preview"}
        />
        <Flex flexDirection="row" alignItems="center" flexShrink={1} justifyContent="space-between">
          <Flex mx={6} flexGrow={1} flexShrink={1} flexDirection="column">
            <CollectionNameSkeleton loading={loading}>
              <Text
                fontWeight={"semiBold"}
                variant={"large"}
                ellipsizeMode="tail"
                numberOfLines={1}
              >
                {collectionMetadata?.tokenName || nft.contract}
              </Text>
            </CollectionNameSkeleton>
            <RowPrice flexDirection="row" alignItems="center">
              <CurrencyIcon currency={currency} size={25} />
              <Text variant="small" color="neutral.c70">
                {(floorPrice || floorPrice === 0) && floorPriceCurrency ? (
                  <>
                    <CurrencyUnitValue
                      showCode={false}
                      unit={floorPriceCurrency.units[0]}
                      value={floorPrice}
                      dynamicSignificantDigits={4}
                    />
                  </>
                ) : (
                  "--"
                )}
              </Text>
            </RowPrice>
          </Flex>
          <TouchableOpacity onPress={() => setOpen(true)}>
            <Icons.MoreHorizontal color="neutral.c100" />
          </TouchableOpacity>
        </Flex>
      </RowRoot>
      <HiddenNftLinkPanel
        onClose={() => setOpen(false)}
        isOpen={isOpen}
        onUnhide={onUnhide}
        nft={nft}
        metaData={nftMetadata as NFTMetadata}
      />
    </>
  );
};

const HiddenNftCollections = () => {
  const hiddenCollections = useSelector(hiddenNftsSelector);
  const dispatch = useDispatch();
  const keyExtractor = useCallback(item => item.id, []);
  return (
    <Box backgroundColor={"background.main"} height={"100%"}>
      <Flex p={2}>
        <CollectionFlatList
          data={hiddenCollections}
          renderItem={({ item: { nft, id } }) => (
            <HiddenNftCollectionRow nft={nft} onUnhide={() => dispatch(unhideNftCollection(id))} />
          )}
          keyExtractor={keyExtractor}
        />
      </Flex>
    </Box>
  );
};

export default HiddenNftCollections;
