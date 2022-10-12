import React, { memo, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";

import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import { Box, Flex, Text } from "@ledgerhq/native-ui";

import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies/";

import { useNavigation } from "@react-navigation/native";
import styled from "@ledgerhq/native-ui/components/styled";
import CurrencyIcon from "../CurrencyIcon";
import NftMedia from "./NftMedia";
import Skeleton from "../Skeleton";
import { NavigatorName, ScreenName } from "../../const";

type Props = {
  nft: ProtoNFT;
};

const StyledTouchableOpacity = styled.TouchableOpacity``;

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
  const navigation = useNavigation();

  const loading = status === "loading";

  const currency = useMemo(
    () => getCryptoCurrencyById(nft.currencyId),
    [nft.currencyId],
  );

  const navigateToNftViewer = useCallback(
    () =>
      navigation.navigate(NavigatorName.NftNavigator, {
        screen: ScreenName.NftViewer,
        params: {
          nft,
        },
      }),
    [navigation, nft],
  );

  return (
    <StyledTouchableOpacity
      mb={3}
      borderRadius={1}
      bg={"background.main"}
      onPress={navigateToNftViewer}
    >
      <NftMedia
        style={styles.image}
        metadata={metadata}
        mediaFormat={"preview"}
        status={status}
      />
      <Box height={36} mb={4}>
        <Skeleton loading={loading} height={8} width={115} borderRadius={4}>
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
    </StyledTouchableOpacity>
  );
};

const NftCardMemo = memo(NftCardView);
// this technique of splitting the usage of context and memoing the presentational component is used to prevent
// the rerender of all NftCards whenever the NFT cache changes (whenever a new NFT is loaded)
const NftListItem = ({ nft }: Props) => {
  const { status, metadata } = useNftMetadata(
    nft?.contract,
    nft?.tokenId,
    nft?.currencyId,
  );

  return <NftCardMemo nft={nft} status={status} metadata={metadata} />;
};

const styles = StyleSheet.create({
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
