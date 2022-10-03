import React, { memo, useMemo } from "react";
import { RectButton } from "react-native-gesture-handler";
import { View, StyleSheet } from "react-native";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";

import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import { Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies/";
import CurrencyIcon from "../CurrencyIcon";
import NftMedia from "./NftMedia";
import LText from "../LText";
import Skeleton from "../Skeleton";

type Props = {
  nft: ProtoNFT;
  style?: any;
};

const displayText = (text?: string | null) => text ?? "--";

const NftCardView = ({
  nft,
  style,
  status,
  metadata,
}: {
  nft: ProtoNFT;
  style?: any;
  status: NFTResource["status"];
  metadata: NFTMetadata;
}) => {
  const { colors } = useTheme();
  const loading = status === "loading";

  const currency = useMemo(
    () => getCryptoCurrencyById(nft.currencyId),
    [nft.currencyId],
  );

  return (
    <View style={style}>
      <RectButton
        style={[
          styles.card,
          {
            backgroundColor: colors.background.main,
          },
        ]}
        onPress={() => console.log("Go to Collection")}
      >
        <NftMedia
          style={styles.image}
          metadata={metadata}
          mediaFormat={"preview"}
          status={status}
        />
        <View style={styles.nftNameContainer}>
          <Skeleton style={styles.skeleton} loading={loading}>
            <Flex flexDirection="column">
              <Flex flexDirection="row" alignItems="center">
                <LText
                  semiBold
                  color={colors.neutral.c100}
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={styles.nftName}
                >
                  {displayText(metadata?.nftName?.toUpperCase())}
                </LText>
                <LText
                  semiBold
                  color={colors.neutral.c100}
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={styles.nftTokenID}
                >
                  {` #${displayText(nft.tokenId)}`}
                </LText>
              </Flex>

              <Flex flexDirection="row" alignItems="center">
                <CurrencyIcon currency={currency} size={20} />
                <LText
                  style={styles.tokenName}
                  color={colors.neutral.c80}
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {displayText(metadata?.tokenName)}
                </LText>
              </Flex>
            </Flex>
          </Skeleton>
        </View>
      </RectButton>
    </View>
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
  card: {
    marginBottom: 8,
    borderRadius: 4,
    width: 160,
  },
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
  nftNameContainer: {
    height: 36,
    marginBottom: 4,
  },
  nftName: {
    lineHeight: 18,
    fontSize: 14,
    width: "65%",
  },
  nftTokenID: {
    lineHeight: 18,
    fontSize: 14,
    width: "35%",
  },
  tokenName: {
    fontSize: 13,
    lineHeight: 15.75,
    width: "90%",
  },
});

export default memo<Props>(NftListItem);
