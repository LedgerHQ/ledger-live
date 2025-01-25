import { Icons } from "@ledgerhq/react-ui";
import React, { memo } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Skeleton } from "../../Skeleton";
import { TitleContainer, Dots } from "./Common";
import { Trans } from "react-i18next";
import { centerEllipsis } from "~/renderer/styles/helpers";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import BigNumber from "bignumber.js";
import { ProtoNFT, NFTMetadata, Account } from "@ledgerhq/types-live";
import ContextMenu from "./ContextMenu";

type Props = {
  tokenName: string;
  tokenId: string;
  standard?: string;
  isLoading: boolean;
  amount?: string | BigNumber;
  nft: ProtoNFT | undefined;
  metadata: NFTMetadata | null | undefined;
  account: Account;
  onHideCollection?: () => void;
};

const RowItem: React.FC<Props> = ({
  tokenName,
  tokenId,
  isLoading,
  amount,
  standard,
  nft,
  metadata,
  account,
  onHideCollection,
}) => {
  const hasContextMenu = !!(nft && metadata);

  return (
    <Flex height={"100%"} width={"100%"} flex={1} justifyContent={"space-between"}>
      <Flex flexDirection={"column"} height={"100%"}>
        <Skeleton width={142} minHeight={24} barHeight={10} show={isLoading}>
          <TitleContainer ff="Inter|Medium" color="palette.text.shade100" fontSize={3}>
            {tokenName || "-"}
          </TitleContainer>
        </Skeleton>
        <Skeleton width={180} minHeight={24} barHeight={6} show={isLoading}>
          <Box horizontal justifyContent="space-between">
            <Text ff="Inter|Medium" color="palette.text.shade50" fontSize={2}>
              <Trans
                i18nKey="NFT.gallery.tokensList.item.tokenId"
                values={{
                  tokenId: centerEllipsis(tokenId),
                }}
              />
            </Text>
          </Box>
        </Skeleton>
      </Flex>
      <Flex alignItems={"center"}>
        {standard === "ERC1155" && (
          <Text ff="Inter|Medium" color="palette.text.shade50" fontSize={3} mr={15}>
            {`x${amount}`}
          </Text>
        )}
        {hasContextMenu && (
          <ContextMenu
            account={account}
            nft={nft}
            metadata={metadata}
            leftClick
            onHideCollection={onHideCollection}
          >
            <Dots>
              <Icons.MoreHorizontal />
            </Dots>
          </ContextMenu>
        )}
      </Flex>
    </Flex>
  );
};

export default memo<Props>(RowItem);
