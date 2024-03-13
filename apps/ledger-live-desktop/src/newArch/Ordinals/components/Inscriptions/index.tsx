import React from "react";
import { Flex, Grid, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { LayoutKey } from "../../types/Layouts";

type Props = {
  layout: LayoutKey;
};

export function Inscriptions({ layout }: Props) {
  return layout === "grid" ? <InscriptionsGrid /> : <Text>List of Inscriptions</Text>;
}

const InscriptionsGrid = () => (
  <StyledGrid flex={1} px={3}>
    {Array.from({ length: 7 }).map((_, i) => (
      <Flex key={i} bg="neutral.c30" p={4} borderRadius={6}>
        <Text>Inscription #{i + 1}</Text>
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
