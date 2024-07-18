import React, { memo } from "react";
import { useNftCollectionMetadata } from "@ledgerhq/live-nft-react";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import NFTCollectionContextMenu from "~/renderer/components/ContextMenu/NFTCollectionContextMenu";
import { Skeleton } from "LLD/features/Collectibles/components";
import styled from "styled-components";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { FieldStatus } from "LLD/features/Collectibles/types/DetailDrawer";

const Dots = styled.div`
  justify-content: flex-end;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  color: ${p => p.theme.colors.palette.text.shade50};
  &:hover {
    color: ${p => p.theme.colors.palette.text.shade80};
  }
`;
const Container = styled.div`
  display: flex;
  column-gap: 10px;
`;

type Props = {
  nft?: ProtoNFT;
  fallback?: string;
  account?: Account;
  showHideMenu?: boolean;
}; // TODO Make me pretty

const CollectionNameComponent: React.FC<Props> = ({ nft, fallback, account, showHideMenu }) => {
  const { status, metadata } = useNftCollectionMetadata(nft?.contract, nft?.currencyId);
  const { tokenName } = metadata || {};
  const loading = status === FieldStatus.Loading;
  const isComponentReady = account && showHideMenu && nft;

  return (
    <Skeleton width={80} minHeight={24} barHeight={10} show={loading}>
      <Container>
        {tokenName || fallback || "-"}
        {isComponentReady && (
          <NFTCollectionContextMenu
            collectionName={tokenName || fallback || "-"}
            collectionAddress={nft.contract || ""}
            account={account}
            leftClick={true}
          >
            <Dots>
              <IconsLegacy.OthersMedium size={20} />
            </Dots>
          </NFTCollectionContextMenu>
        )}
      </Container>
    </Skeleton>
  );
};
export const CollectionName = memo<Props>(CollectionNameComponent);
