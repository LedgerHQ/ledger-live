import React, { memo, useCallback } from "react";
import { StyleSheet } from "react-native";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";
import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import { Box, Flex, Tag, Text } from "@ledgerhq/native-ui";
import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { useTranslation } from "react-i18next";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";

import NftMedia from "../NftMedia";
import Skeleton from "../../Skeleton";
import { NftSelectionCheckbox } from "../NftSelectionCheckbox";
import NftListItemFloorPriceRow from "./NftListItemFloorPriceRow";
import { DesignedForStaxText } from "../DesignedForStax";
import { knownDeviceModelIdsSelector } from "../../../reducers/settings";

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
  onPress,
  onLongPress,
  selectable = false,
  isSelected = false,
}: {
  nft: ProtoNFT;
  status: NFTResource["status"];
  metadata: NFTMetadata;
  onPress?: () => void;
  onLongPress?: () => void;
  selectable?: boolean;
  isSelected?: boolean;
}) => {
  const loading = status === "loading";

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
          <FeatureToggle feature="counterValue">
            <NftListItemFloorPriceRow nft={nft} />
          </FeatureToggle>
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

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(nft, metadata);
    }
  }, [onPress, metadata, nft]);

  return (
    <NftCardMemo
      nft={nft}
      status={status}
      metadata={metadata}
      onPress={handlePress}
      onLongPress={onLongPress}
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
  const { space } = useTheme();
  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);

  return (
    <Box>
      <Flex mb={4}>
        <NftMedia
          style={[
            styles.image,
            {
              opacity: isSelected ? 0.3 : selectable ? 0.7 : 1,
            },
          ]}
          status={status}
          metadata={metadata}
          mediaFormat="preview"
        >
          {knownDeviceModelIds.stax && !!metadata?.staxImage ? (
            <Flex zIndex={1000} position="absolute" bottom={0} width="100%">
              <DesignedForStaxText size="small" />
            </Flex>
          ) : null}
        </NftMedia>
      </Flex>
      {nftAmount && nftAmount.gt(1) ? (
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
      ) : null}

      {selectable && (
        <Flex position="absolute" top={`${space[5]}px`} left={`${space[5]}px`}>
          <NftSelectionCheckbox isSelected={isSelected} />
        </Flex>
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  image: {
    position: "absolute",
    borderRadius: 8,
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
  },
});

export default memo<Props>(NftListItem);
