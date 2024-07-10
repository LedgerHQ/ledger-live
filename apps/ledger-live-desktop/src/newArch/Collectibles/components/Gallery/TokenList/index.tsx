import React, { memo } from "react";
import styled from "styled-components";
import { Account } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import { useSelector } from "react-redux";
import { collectiblesViewModeSelector } from "~/renderer/reducers/settings";
import Item from "./Item";
import { Layout, LayoutKey } from "LLD/Collectibles/types/Layouts";

type Props = {
  account: Account;
  collectibles: {
    id: string;
    previewUri: string;
    tokenName: string;
    isLoading: boolean;
    mediaType: string;
  }[];
  onHideCollection?: () => void;
};

const Container = styled(Box).attrs<{
  mode?: LayoutKey;
}>({})<{ mode?: LayoutKey }>`
  display: ${p => (p.mode === Layout.LIST ? "flex" : "grid")};
  grid-gap: ${p => (p.mode === Layout.LIST ? 10 : 18)}px;
  grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
`;

const TokensList = ({ account, collectibles, onHideCollection }: Props) => {
  const collectiblesViewMode = useSelector(collectiblesViewModeSelector);

  return (
    <Container mb={20} mode={collectiblesViewMode}>
      {collectibles.map(collectible => (
        <Item
          key={collectible.id}
          mode={collectiblesViewMode}
          id={collectible.id}
          tokenName={collectible.tokenName}
          account={account}
          isLoading={collectible.isLoading}
          previewUri={collectible.previewUri}
          mediaType={collectible.mediaType}
          onHideCollection={onHideCollection}
          withContextMenu
        />
      ))}
    </Container>
  );
};

export default memo<Props>(TokensList);
