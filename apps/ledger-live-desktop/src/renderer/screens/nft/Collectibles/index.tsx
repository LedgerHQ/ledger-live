import { Grid } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";
import { SatsCard } from "./Sats";

export function Collectibles() {
  const NB_CARDS = 7;
  return (
    <CollectibleGrid bg={"palette.background.paper"} p={5} borderRadius={6}>
      {Array.from({ length: NB_CARDS }).map((_, i) => (
        <SatsCard
          collectionName={i + " Name"}
          contract={"contract"}
          tokenId={0}
          totalStats={0}
          key={i}
        />
      ))}
    </CollectibleGrid>
  );
}

const CollectibleGrid = styled(Grid).attrs(() => ({
  columnGap: 4,
  columns: 4,
  rowGap: 4,
}))`
  grid-template-columns: repeat(4, 1fr);
`;
