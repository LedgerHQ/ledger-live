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

import { useNavigation } from "@react-navigation/native";
import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import CurrencyIcon from "../CurrencyIcon";
import NftMedia from "./NftMedia";
import Skeleton from "../Skeleton";
import { NavigatorName, ScreenName } from "../../const";
import { track } from "../../analytics";

type Props = {
  nft: ProtoNFT;
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
}: {
  nft: ProtoNFT;
  status: NFTResource["status"];
  metadata: NFTMetadata;
  collectionStatus: NFTResource["status"];
  collectionMetadata?: NFTCollectionMetadata | null;
}) => {
  const navigation = useNavigation();
  const currency = useMemo(
    () => getCryptoCurrencyById(nft.currencyId),
    [nft.currencyId],
  );

  const loading = status === "loading";
  const collectionLoading = collectionStatus === "loading";

  const navigateToNftViewer = useCallback(() => {
    track("NFT_clicked", {
      NFT_collection: metadata?.tokenName,
      NFT_title: metadata?.nftName,
    });

    navigation.navigate(NavigatorName.NftNavigator, {
      screen: ScreenName.NftViewer,
      params: {
        nft,
      },
    });
  }, [metadata, navigation, nft]);

  return (
    <StyledTouchableOpacity bg="background.main" onPress={navigateToNftViewer}>
      <NftMediaComponent
        status={status}
        metadata={metadata}
        nftAmount={nft.standard === "ERC1155" ? nft.amount : undefined}
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
const NftListItem = ({ nft }: Props) => {
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

  return (
    <NftCardMemo
      nft={nft}
      status={status}
      metadata={metadata}
      collectionStatus={collectionStatus}
      collectionMetadata={collectionMetadata}
    />
  );
};

type NftMediaProps = {
  status: NFTResource["status"];
  metadata: NFTMetadata;
  nftAmount?: ProtoNFT["amount"];
};
const NftMediaComponent = ({ status, metadata, nftAmount }: NftMediaProps) => {
  const { t } = useTranslation();
  if (nftAmount && nftAmount.gt(1)) {
    return (
      <Box position="relative">
        <NftMedia
          style={styles.image}
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
