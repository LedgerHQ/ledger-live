import React from "react";
import { Flex, Grid, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useNftGallery } from "../../hooks/useNftGallery";
import { Ordinal } from "../../types/Ordinals";

type Props = {
  layout: string;
};

export function Inscriptions({ layout }: Props) {
  const { nfts } = useNftGallery({
    addresses: "bc1pgtat0n2kavrz4ufhngm2muzxzx6pcmvr4czp089v48u5sgvpd9vqjsuaql",
    standard: "inscriptions",
    threshold: 10,
  });
  return layout === "grid" ? (
    <InscriptionsGrid data={nfts || []} />
  ) : (
    <Text>List of Inscriptions</Text>
  );
}

const InscriptionsGrid = ({ data }: { data: Ordinal[] }) => (
  <StyledGrid flex={1}>
    {data.map((ordinal, i) => (
      <Flex bg="neutral.c30" p={4} borderRadius={6}>
        <Text key={i}>{ordinal.name ?? ordinal.contract.name}</Text>
      </Flex>
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
