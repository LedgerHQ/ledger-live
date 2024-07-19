import React, { memo } from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import { useSelector } from "react-redux";
import { collectiblesViewModeSelector } from "~/renderer/reducers/settings";
import Item from "./Item";
import { Layout, LayoutKey } from "LLD/Collectibles/types/Layouts";
import { TokenListProps } from "~/newArch/Collectibles/Nfts/components/TokensList/useTokensListModel";

type Props = {
  account: TokenListProps["account"];
  collectibles: TokenListProps["formattedNfts"];
  onHideCollection?: () => void;
  onItemClick: (id: string) => void;
};

const Container = styled(Box).attrs<{
  mode?: LayoutKey;
}>({})<{ mode?: LayoutKey }>`
  display: ${p => (p.mode === Layout.LIST ? "flex" : "grid")};
  grid-gap: ${p => (p.mode === Layout.LIST ? 10 : 18)}px;
  grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
`;

const TokensList = ({ account, collectibles, onHideCollection, onItemClick }: Props) => {
  const collectiblesViewMode = useSelector(collectiblesViewModeSelector);

  return (
    <Container mb={20} mode={collectiblesViewMode}>
      {collectibles.map(collectible => (
        <Item
          key={collectible.id}
          mode={collectiblesViewMode}
          id={collectible.id}
          metadata={collectible.metadata}
          nft={collectible.nft}
          amount={collectible.amount}
          standard={collectible.standard}
          tokenName={collectible.tokenName}
          account={account}
          isLoading={collectible.isLoading}
          previewUri={collectible.previewUri}
          mediaType={collectible.mediaType}
          onHideCollection={onHideCollection}
          onItemClick={() => onItemClick(collectible.collectibleId)}
        />
      ))}
    </Container>
  );
};

export default memo<Props>(TokensList);
