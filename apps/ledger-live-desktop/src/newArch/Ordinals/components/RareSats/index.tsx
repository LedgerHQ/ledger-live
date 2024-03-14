import React from "react";
import { Grid, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { SatsCard } from "./Sats";
import { useNftGallery } from "../../hooks/useNftGallery";
import { Ordinal } from "../../types/Ordinals";
import { LayoutKey } from "../../types/Layouts";
import { Account } from "@ledgerhq/types-live";

type Props = {
  layout: LayoutKey;
  account: Account;
};

export function RareSats({ layout }: Props) {
  const { nfts } = useNftGallery({
    addresses: "bc1pgtat0n2kavrz4ufhngm2muzxzx6pcmvr4czp089v48u5sgvpd9vqjsuaql",
    standard: "raresats",
    threshold: 10,
  });
  return layout === "grid" ? <RareSatsGrid data={nfts} /> : <Text>List of Rare Sats</Text>;
}

const RareSatsGrid = ({ data }: { data: Ordinal[] }) => (
  <StyledGrid flex={1}>
    {/* TODO: replace with datas */}
    {data.map((ordinal, i) => (
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
