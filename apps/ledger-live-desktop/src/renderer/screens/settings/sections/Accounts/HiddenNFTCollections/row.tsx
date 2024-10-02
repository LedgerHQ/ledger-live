import React, { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNftMetadata, useNftCollectionMetadata } from "@ledgerhq/live-nft-react";
import { accountSelector } from "~/renderer/reducers/accounts";
import { State } from "~/renderer/reducers";
import { NFTMetadata } from "@ledgerhq/types-live";
import { clipboard } from "electron";

import Text from "~/renderer/components/Text";
import Media from "~/renderer/components/Nft/Media";
import Skeleton from "~/renderer/components/Nft/Skeleton";
import { Box, Flex, Icons } from "@ledgerhq/react-ui";

import IconCross from "~/renderer/icons/Cross";
import styled from "styled-components";
import { splitAddress } from "./helpers";

export const HiddenNftCollectionRow = ({
  contractAddress,
  accountId,
  onUnhide,
}: {
  contractAddress: string;
  accountId: string;
  onUnhide: () => void;
}) => {
  const { t } = useTranslation();
  const account = useSelector((state: State) => accountSelector(state, { accountId }));
  const firstNft = account?.nfts?.find(nft => nft.contract === contractAddress);

  const { metadata: nftMetadata, status: nftStatus } = useNftMetadata(
    contractAddress,
    firstNft?.tokenId,
    firstNft?.currencyId,
  );
  const { metadata: collectionMetadata, status: collectionStatus } = useNftCollectionMetadata(
    contractAddress,
    firstNft?.currencyId,
  );

  const loading = useMemo(
    () => nftStatus === "loading" || collectionStatus === "loading",
    [nftStatus, collectionStatus],
  );

  const [copyFeedback, setCopyFeedback] = useState(false);

  const onCopy = useCallback(() => {
    clipboard.writeText(contractAddress);
    setCopyFeedback(true);

    setTimeout(() => setCopyFeedback(false), 1e3);
  }, [contractAddress]);

  return (
    <HiddenNftCollectionRowContainer>
      <Flex>
        <Skeleton width={32} minHeight={32} show={loading}>
          {nftMetadata && firstNft && (
            <Media
              metadata={nftMetadata as NFTMetadata}
              tokenId={firstNft?.tokenId}
              mediaFormat="preview"
            />
          )}
        </Skeleton>

        <Flex flexDirection="column" ml={3} flex={1}>
          <Text ff="Inter|Medium" color="palette.text.shade100" fontSize={3}>
            {collectionMetadata?.tokenName || contractAddress}
          </Text>

          <StyledFlex alignItems="center" onClick={onCopy}>
            <Text ff="Inter|Medium" fontSize={3} mr={2}>
              {splitAddress(contractAddress, 8)}
            </Text>

            {!copyFeedback ? (
              <Icons.Copy size="XS" />
            ) : (
              <>
                <Icons.Check size="XS" color="success.c70" />
                <Text ff="Inter|Medium" ml={1} fontSize={3} color="neutral.c100">
                  {t("common.addressCopied")}
                </Text>
              </>
            )}
          </StyledFlex>
        </Flex>
      </Flex>

      <IconContainer onClick={onUnhide}>
        <IconCross size={16} />
      </IconContainer>
    </HiddenNftCollectionRowContainer>
  );
};

const IconContainer = styled.div`
  color: ${p => p.theme.colors.palette.text.shade60};
  text-align: center;
  &:hover {
    cursor: pointer;
    color: ${p => p.theme.colors.palette.text.shade40};
  }
`;

const HiddenNftCollectionRowContainer = styled(Box).attrs({
  alignItems: "center",
  justifyContent: "space-between",
  horizontal: true,
  flow: 1,
  py: 1,
})`
  margin: 0px;
  &:not(:last-child) {
    border-bottom: 1px solid ${p => p.theme.colors.palette.text.shade10};
  }
  padding: 14px 6px;
`;

const StyledFlex = styled(Flex)`
  &:hover {
    cursor: pointer;
    color: ${p => p.theme.colors.primary.c80};
  }
`;
