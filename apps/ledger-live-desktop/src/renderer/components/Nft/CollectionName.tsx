import React, { memo, useMemo } from "react";
import { useNftCollectionMetadata } from "@ledgerhq/live-common/nft/index";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import NFTCollectionContextMenu from "~/renderer/components/ContextMenu/NFTCollectionContextMenu";
import Skeleton from "~/renderer/components/Nft/Skeleton";
import styled from "styled-components";
import { Icons } from "@ledgerhq/react-ui";
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
const CollectionName = ({ nft, fallback, account, showHideMenu }: Props) => {
  const { status, metadata } = useNftCollectionMetadata(nft?.contract, nft?.currencyId);
  const { tokenName } = metadata || {};
  const loading = useMemo(() => status === "loading", [status]);
  return (
    <Skeleton width={80} minHeight={24} barHeight={10} show={loading}>
      <Container>
        {tokenName || fallback || "-"}
        {account && showHideMenu && nft && (
          <NFTCollectionContextMenu
            collectionName={tokenName || fallback || "-"}
            collectionAddress={nft.contract || ""}
            account={account}
            leftClick={true}
          >
            <Dots>
              <Icons.OthersMedium size={20} />
            </Dots>
          </NFTCollectionContextMenu>
        )}
      </Container>
    </Skeleton>
  );
};
export default memo<Props>(CollectionName);
