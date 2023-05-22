import React, { useMemo, memo } from "react";
import styled from "styled-components";
import {
  useNftCollectionMetadata,
  useNftMetadata,
} from "@ledgerhq/live-common/nft/NftMetadataProvider/index";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { rgba } from "~/renderer/styles/helpers";
import { Account, NFT, NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import NFTCollectionContextMenu from "~/renderer/components/ContextMenu/NFTCollectionContextMenu";
import Media from "~/renderer/components/Nft/Media";
import Skeleton from "~/renderer/components/Nft/Skeleton";
const Container = styled(Box)`
  &.disabled {
    pointer-events: none;
  }

  &:not(:nth-child(2)) {
    border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
  }
  cursor: pointer;
  &:hover {
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }
`;
type Props = {
  nfts: (ProtoNFT | NFT)[];
  contract: string;
  account: Account;
  onClick: () => void;
};
const Row = ({ nfts, contract, account, onClick }: Props) => {
  const [nft] = nfts;
  const { status: collectionStatus, metadata: collectionMetadata } = useNftCollectionMetadata(
    contract,
    account.currency.id,
  );
  const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
    contract,
    nft.tokenId,
    account.currency.id,
  );
  const { tokenName } = collectionMetadata || {};
  const loading = useMemo(() => nftStatus === "loading" || collectionStatus === "loading", [
    collectionStatus,
    nftStatus,
  ]);
  return (
    <NFTCollectionContextMenu
      collectionName={tokenName || undefined}
      collectionAddress={contract}
      account={account}
    >
      <Container
        className={loading || process.env.ALWAYS_SHOW_SKELETONS ? "disabled" : ""}
        justifyContent="center"
        horizontal
        px={4}
        py={3}
        onClick={onClick}
      >
        <Skeleton width={32} minHeight={32} show={loading}>
          <Media
            metadata={nftMetadata as NFTMetadata}
            tokenId={nft?.tokenId}
            mediaFormat="preview"
          />
        </Skeleton>
        <Box ml={3} flex={1}>
          <Skeleton width={136} minHeight={24} barHeight={10} show={loading}>
            <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
              {tokenName || contract}
            </Text>
          </Skeleton>
        </Box>
        <Skeleton width={42} minHeight={24} barHeight={10} show={loading}>
          <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4} textAlign="right">
            {nfts?.length ?? 0}
          </Text>
        </Skeleton>
      </Container>
    </NFTCollectionContextMenu>
  );
};
export default memo<Props>(Row);
