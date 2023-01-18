import React, { memo, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import {
  useNftCollectionMetadata,
  useNftMetadata,
} from "@ledgerhq/live-common/nft/index";

import {
  NFTCollectionMetadata,
  NFTCollectionMetadataResponse,
  NFTMetadata,
  NFTMetadataResponse,
  ProtoNFT,
} from "@ledgerhq/types-live";
import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import { Box, Flex, Tag, Text } from "@ledgerhq/native-ui";

import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import CurrencyIcon from "../CurrencyIcon";
import NftMedia from "./NftMedia";
import Skeleton from "../Skeleton";
import { SelectNft } from "./SelectNft";

type Props = {
  nft: ProtoNFT;
  onPress?: (nft: ProtoNFT, nftMetadata?: NFTMetadata) => void;
  onLongPress?: () => void;
  selectable?: boolean;
  isSelected?: boolean;
};

const StyledTouchableOpacity = styled.TouchableOpacity<BaseStyledProps>`
  margin-bottom: ${p => p.theme.space[3]}px;
  border-radius: ${p => p.theme.radii[1]}px;
  background-color: ${props => props.theme.colors.background.main};
`;

const displayText = (text?: string | null) => text || "--";

const NftCardView = ({
  nft,
  status,
  metadata,
  collectionStatus,
  collectionMetadata,
  onPress,
  onLongPress,
  selectable = false,
  isSelected = false,
}: {
  nft: ProtoNFT;
  status: NFTResource["status"];
  metadata: NFTMetadata;
  collectionStatus: NFTResource["status"];
  collectionMetadata?: NFTCollectionMetadata | null;
  onPress?: () => void;
  onLongPress?: () => void;
  selectable?: boolean;
  isSelected?: boolean;
}) => {
  const currency = useMemo(
    () => getCryptoCurrencyById(nft.currencyId),
    [nft.currencyId],
  );

  const loading = status === "loading";
  const collectionLoading = collectionStatus === "loading";

  return (
    <StyledTouchableOpacity
      bg="background.main"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <NftMediaComponent
        status={status}
        metadata={metadata}
        nftAmount={nft.standard === "ERC1155" ? nft.amount : undefined}
        isSelected={isSelected}
        selectable={selectable}
      />
      <Box mb={7}>
        <Flex flexDirection="column">
          <Skeleton
            loading={!metadata?.nftName && loading}
            height={13}
            width={115}
            borderRadius={4}
            my={2}
          >
            <Text
              variant="body"
              fontWeight="medium"
              color="neutral.c100"
              ellipsizeMode="tail"
              numberOfLines={1}
              flexGrow={1}
            >
              {displayText(metadata?.nftName)}
            </Text>
          </Skeleton>

          <Flex flexDirection="row" alignItems="center">
            <CurrencyIcon currency={currency} size={20} />

            <Skeleton
              loading={
                !collectionMetadata?.tokenName &&
                !metadata?.tokenName &&
                collectionLoading
              }
              height={13}
              width={115}
              borderRadius={4}
              ml={2}
              my={2}
            >
              <Text
                variant="paragraph"
                fontWeight="medium"
                color="neutral.c80"
                ellipsizeMode="tail"
                numberOfLines={1}
                ml={2}
                flexGrow={1}
                flexShrink={1}
              >
                {displayText(
                  collectionMetadata?.tokenName || metadata?.tokenName,
                )}
              </Text>
            </Skeleton>
          </Flex>
        </Flex>
      </Box>
    </StyledTouchableOpacity>
  );
};

const NftCardMemo = memo(NftCardView);
// this technique of splitting the usage of context and memoing the presentational component is used to prevent
// the rerender of all NftCards whenever the NFT cache changes (whenever a new NFT is loaded)
const NftListItem = ({
  nft,
  onPress,
  onLongPress,
  isSelected,
  selectable,
}: Props) => {
  const nftMetadata = useNftMetadata(
    nft?.contract,
    nft?.tokenId,
    nft?.currencyId,
  );
  // FIXME: wtf is this metadata property and where does it come from?
  const { status, metadata } = nftMetadata as NFTResource & {
    metadata: NFTMetadata;
  };

  const { status: collectionStatus, metadata: collectionMetadata } =
    useNftCollectionMetadata(nft?.contract, nft?.currencyId) as {
      status: NFTResource["status"];
      metadata?: NFTMetadataResponse["result"] &
        NFTCollectionMetadataResponse["result"];
    };

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(nft, metadata);
    }
  }, [onPress, metadata, nft]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress();
    }
  }, [onLongPress]);

  return (
    <NftCardMemo
      nft={nft}
      status={status}
      metadata={metadata}
      collectionStatus={collectionStatus}
      collectionMetadata={collectionMetadata}
      onPress={handlePress}
      onLongPress={handleLongPress}
      selectable={selectable}
      isSelected={isSelected}
    />
  );
};

type NftMediaProps = {
  status: NFTResource["status"];
  metadata: NFTMetadata;
  nftAmount?: ProtoNFT["amount"];
};
type SelectionProps = {
  selectable: boolean;
  isSelected: boolean;
};
const NftMediaComponent = ({
  status,
  metadata,
  nftAmount,
  selectable,
  isSelected,
}: NftMediaProps & SelectionProps) => {
  const { t } = useTranslation();
  if (nftAmount && nftAmount.gt(1)) {
    return (
      <Box position="relative">
        <NftMedia
          style={[
            styles.image,
            { opacity: isSelected ? 0.2 : selectable ? 0.8 : 1 },
          ]}
          metadata={metadata}
          mediaFormat="preview"
          status={status}
        />
        <Tag
          position="absolute"
          top="10px"
          right="10px"
          backgroundColor="neutral.c30"
          uppercase={false}
          borderRadius={1}
        >
          {t("wallet.nftGallery.media.tag", { count: nftAmount.toNumber() })}
        </Tag>

        {selectable && (
          <Flex position="absolute" bottom={"20px"} left={"10px"}>
            <SelectNft isSelected={isSelected} />
          </Flex>
        )}
      </Box>
    );
  }

  if (selectable) {
    return (
      <Box position="relative">
        <NftMedia
          style={[
            styles.image,
            { opacity: isSelected ? 0.3 : selectable ? 0.8 : 1 },
          ]}
          metadata={metadata}
          mediaFormat="preview"
          status={status}
        />
        <Flex position="absolute" bottom={"20px"} left={"10px"}>
          <SelectNft isSelected={isSelected} />
        </Flex>
      </Box>
    );
  }

  return (
    <NftMedia
      style={styles.image}
      metadata={metadata}
      mediaFormat="preview"
      status={status}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    position: "absolute",
    borderRadius: 8,
    marginBottom: 12,
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
  },
});

export default memo<Props>(NftListItem);
