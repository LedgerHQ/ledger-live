import React, { memo } from "react";
import { RectButton } from "react-native-gesture-handler";
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from "react-native";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";
import { useTheme, useNavigation } from "@react-navigation/native";
import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import { useTranslation } from "react-i18next";
import { NavigatorName, ScreenName } from "../../const";
import Skeleton from "../Skeleton";
import NftMedia from "./NftMedia";
import LText from "../LText";

type Props = {
  nft: ProtoNFT;
  style?: StyleProp<ViewStyle>;
};

const NftCardView = ({
  nft,
  style,
  status,
  metadata,
}: {
  nft: ProtoNFT;
  style?: StyleProp<ViewStyle>;
  status: NFTResource["status"];
  metadata: NFTMetadata;
}) => {
  const { t } = useTranslation();
  const amount = nft?.amount?.toFixed();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const loading = status === "loading";

  return (
    <View style={style}>
      <RectButton
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
          },
        ]}
        onPress={() => {
          navigation.navigate(NavigatorName.NftNavigator, {
            screen: ScreenName.NftViewer,
            params: {
              nft,
            },
          });
        }}
      >
        <NftMedia
          style={styles.image}
          metadata={metadata}
          mediaFormat={"preview"}
          status={status}
        />
        <View style={styles.nftNameContainer}>
          <Skeleton style={styles.tokenNameSkeleton} loading={loading}>
            <LText
              semiBold
              color={colors.text}
              ellipsizeMode="tail"
              numberOfLines={2}
              style={styles.tokenName}
            >
              {metadata?.nftName?.toUpperCase() ?? "-"}
            </LText>
          </Skeleton>
        </View>
        <View style={styles.footer}>
          <LText
            style={[styles.tokenId, { color: colors.grey }]}
            ellipsizeMode="middle"
            numberOfLines={1}
          >
            {t("common.patterns.id", { value: nft?.tokenId })}
          </LText>
          {amount > "1" ? (
            <LText
              semiBold
              style={[styles.amount, { color: colors.grey }]}
              ellipsizeMode="middle"
              numberOfLines={1}
            >
              {t("common.patterns.times", { value: amount })}
            </LText>
          ) : null}
        </View>
      </RectButton>
    </View>
  );
};

const NftCardMemo = memo(NftCardView);
// this technique of splitting the usage of context and memoing the presentational component is used to prevent
// the rerender of all NftCards whenever the NFT cache changes (whenever a new NFT is loaded)
const NftCard = ({ nft, style }: Props) => {
  const nftMetadata = useNftMetadata(
    nft?.contract,
    nft?.tokenId,
    nft?.currencyId,
  );
  // FIXME: wtf is this metadata property and where does it come from?
  const { status, metadata } = nftMetadata as NFTResource & {
    metadata: NFTMetadata;
  };

  return (
    <NftCardMemo
      nft={nft}
      style={style}
      status={status}
      metadata={metadata as NFTMetadata}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: {
          height: 4,
          width: 0,
        },
      },
    }),
  },

  image: {
    position: "absolute",
    borderRadius: 4,
    marginBottom: 12,
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
  },
  nftNameContainer: {
    height: 36,
    marginBottom: 4,
  },
  tokenNameSkeleton: {
    height: 10,
    width: "90%",
    borderRadius: 4,
  },
  tokenName: {
    lineHeight: 18,
    fontSize: 15,
  },
  footer: {
    flexWrap: "nowrap",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  tokenId: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 13,
  },
  amount: {
    flexGrow: 1,
    flexShrink: 0,
    fontSize: 14,
    textAlign: "right",
    paddingLeft: 8,
  },
});

export default memo<Props>(NftCard);
