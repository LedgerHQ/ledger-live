import React, { useCallback, memo } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Flex, Text } from "@ledgerhq/react-ui";
import { rgba } from "@ledgerhq/react-ui/styles/index";
import { NFTMetadata } from "@ledgerhq/types-live";
import { getNFTById } from "~/renderer/reducers/accounts";
import Media from "~/renderer/components/Nft/Media";
import Skeleton from "~/renderer/components/Nft/Skeleton";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";

const Wrapper = styled(Flex).attrs({
  backgroundColor: "neutral.c30",
  borderRadius: 1,
  flexDirection: "column",
  alignItems: "flex-start",
})<{ selected?: boolean }>`
  &.disabled {
    pointer-events: none;
  }

  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color ease-in-out 200ms;
  ${p =>
    p.selected
      ? `
  box-shadow: 0 0 0 4px ${rgba(p.theme.colors.primary.c60, 0.4)};
  border: 1px solid ${p.theme.colors.primary.c60};
  &:active {
    border: 1px solid transparent;
  }
  `
      : `
  &:focus,
  &:hover {
    box-shadow: 0 0 0 2px ${rgba(p.theme.colors.primary.c60, 0.4)};
  }
  &:active {
    box-shadow: 0 0 0 4px ${rgba(p.theme.colors.primary.c60, 0.4)};
    border: 1px solid ${p.theme.colors.primary.c60};
  }
      `};
`;

const EllipsizedText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type Props = {
  id: string;
  onItemClick: (nftId: string, nftMetadata: NFTMetadata) => void;
  selected: boolean;
  testId?: string;
  index: number;
};

const NftItem = ({ id, onItemClick, selected, testId, index }: Props) => {
  const nft = useSelector(state => getNFTById(state, { nftId: id }));
  const { status, metadata } = useNftMetadata(nft.contract, nft.tokenId, nft.currencyId);
  const { nftName } = metadata || {};
  const show = status === "loading";
  const isGrid = true;

  const handleClick = useCallback(() => {
    onItemClick(id, metadata);
  }, [metadata, id, onItemClick]);

  return (
    <Wrapper
      height="100%"
      width="100%"
      flex={1}
      px={3}
      py={3}
      selected={selected}
      className={show || process.env.ALWAYS_SHOW_SKELETONS ? "disabled" : ""}
      onClick={handleClick}
      data-test-id={testId}
    >
      <Flex flex={1} width="100%" data-test-id={`custom-image-nft-card-media-${index}`}>
        <Skeleton width={40} minHeight={40} full={isGrid} show={show}>
          <Media
            metadata={metadata}
            tokenId={nft.tokenId}
            full
            objectFit="cover"
            mediaFormat="preview"
          />
        </Skeleton>
      </Flex>
      <Flex mt={2} flexDirection="column" width={"100%"}>
        <EllipsizedText
          variant="small"
          fontWeight="medium"
          data-test-id={`custom-image-nft-card-name-${index}`}
        >
          {nftName || "-"}
        </EllipsizedText>
        <EllipsizedText
          variant="small"
          fontWeight="medium"
          color="neutral.c60"
          data-test-id={`custom-image-nft-card-id-${index}`}
        >
          <Trans i18nKey="NFT.gallery.tokensList.item.tokenId" values={{ tokenId: nft.tokenId }} />
        </EllipsizedText>
      </Flex>
    </Wrapper>
  );
};

export default memo<Props>(NftItem);
