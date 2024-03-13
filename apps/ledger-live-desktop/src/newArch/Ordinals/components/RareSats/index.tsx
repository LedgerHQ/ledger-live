import React from "react";
import { Grid, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { SatsCard } from "./Sats";
import { LayoutKey } from "../../types/Layouts";

type Props = {
  layout: LayoutKey;
};

export function RareSats({ layout }: Props) {
  return layout === "grid" ? <RareSatsGrid /> : <Text>List of Rare Sats</Text>;
}

const RareSatsGrid = () => (
  <StyledGrid flex={1}>
    {Array.from({ length: 7 }).map((_, i) => (
      <SatsCard
        collections={
          i % 2 === 0
            ? [
                {
                  name: "Nakamoto",
                  totalStats: 20,
                },
                {
                  name: "Pizza",
                  totalStats: 2,
                },
                {
                  name: "Hitman",
                  totalStats: 2,
                },
                {
                  name: "Vintage",
                  totalStats: 2,
                },
                {
                  name: "Alpha",
                  totalStats: 2,
                },
              ]
            : [
                {
                  name: "Block78",
                  totalStats: 2,
                },
                {
                  name: "Epic",
                  totalStats: 34,
                },
              ]
        }
        year={0}
        totalStats={0}
        key={i}
      />
    ))}
  </StyledGrid>
);

const StyledGrid = styled(Grid).attrs(() => ({
  columnGap: 4,
  columns: 4,
  rowGap: 4,
}))`
  grid-template-columns: repeat(4, 1fr);
`;
