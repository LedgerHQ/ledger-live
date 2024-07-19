import React, { memo } from "react";
import styled from "styled-components";
import { Account, NFT, ProtoNFT } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import { useSelector } from "react-redux";
import { nftsViewModeSelector } from "~/renderer/reducers/settings";
import Item from "./Item";
type Props = {
  account: Account;
  isLoading?: boolean;
  nfts: (ProtoNFT | NFT)[];
  onHideCollection?: () => void;
};
const Container = styled(Box).attrs<{
  mode?: "grid" | "list";
}>({})<{ mode?: "grid" | "list" }>`
  display: ${p => (p.mode === "list" ? "flex" : "grid")};
  grid-gap: ${p => (p.mode === "list" ? 10 : 18)}px;
  grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
`;
const TokensList = ({ account, nfts, onHideCollection }: Props) => {
  const nftsViewMode = useSelector(nftsViewModeSelector);
  return (
    <Container mb={20} mode={nftsViewMode}>
      {nfts.map(nft => (
        <Item
          key={nft.id}
          mode={nftsViewMode}
          id={nft.id}
          account={account}
          onHideCollection={onHideCollection}
        />
      ))}
    </Container>
  );
};
export default memo<Props>(TokensList);
