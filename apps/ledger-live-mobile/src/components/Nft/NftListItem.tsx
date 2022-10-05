import React, { memo, useMemo } from "react";
import { RectButton } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";

import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import { Box, Flex, Text } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies/";

import CurrencyIcon from "../CurrencyIcon";
import NftMedia from "./NftMedia";
import Skeleton from "../Skeleton";

type Props = {
  nft: ProtoNFT;
  style?: any;
};

const StyledRectButton = styled(RectButton)`
  margin-bottom: 8;
  border-radius: 4;
  background-color: ${props => props.theme.colors.background.main};
`;

const displayText = (text?: string | null) => text ?? "--";

const NftCardView = ({
  nft,
  status,
  metadata,
}: {
  nft: ProtoNFT;
  status: NFTResource["status"];
  metadata: NFTMetadata;
}) => {
  const loading = status === "loading";

  const currency = useMemo(
    () => getCryptoCurrencyById(nft.currencyId),
    [nft.currencyId],
  );

  return (
    <StyledRectButton onPress={() => console.log("Go to Collection")}>
      <NftMedia
        style={styles.image}
        metadata={metadata}
        mediaFormat={"preview"}
        status={status}
      />
      <Box height={36} mb={4}>
        <Skeleton style={styles.skeleton} loading={loading}>
          <Flex flexDirection="column">
            <Flex flexDirection={"row"}>
              <Text
                variant="body"
                fontWeight="medium"
                color="neutral.c100"
                ellipsizeMode="tail"
                numberOfLines={1}
                flexShrink={1}
              >
                {displayText(metadata?.nftName)}
              </Text>

              <Text
                variant="body"
                fontWeight="medium"
                color="neutral.c100"
                ellipsizeMode="tail"
                numberOfLines={1}
                flexGrow={1}
              >
                {` #${displayText(nft.tokenId)}`}
              </Text>
            </Flex>

            <Flex flexDirection="row" alignItems="center">
              <CurrencyIcon currency={currency} size={20} />

              <Text
                variant="paragraph"
                fontWeight="medium"
                color="neutral.c80"
                ellipsizeMode="tail"
                numberOfLines={1}
                ml={2}
                flexGrow={1}
              >
                {displayText(metadata?.tokenName)}
              </Text>
            </Flex>
          </Flex>
        </Skeleton>
      </Box>
    </StyledRectButton>
  );
};

const NftCardMemo = memo(NftCardView);
// this technique of splitting the usage of context and memoing the presentational component is used to prevent
// the rerender of all NftCards whenever the NFT cache changes (whenever a new NFT is loaded)
const NftListItem = ({ nft, style }: Props) => {
  const { status, metadata } = useNftMetadata(
    nft?.contract,
    nft?.tokenId,
    nft?.currencyId,
  );

  return (
    <NftCardMemo nft={nft} style={style} status={status} metadata={metadata} />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    height: 8,
    width: 115,
    borderRadius: 4,
  },
  image: {
    position: "absolute",
    borderRadius: 4,
    marginBottom: 12,
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    height: 160,
  },
});

export default memo<Props>(NftListItem);
