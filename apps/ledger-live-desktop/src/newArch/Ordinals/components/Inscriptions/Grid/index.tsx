import { Flex, Grid, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { Ordinal } from "../../../types/Ordinals";
import React from "react";
import Image from "~/renderer/components/Image";
import ItemHeader from "../../Nft/ItemHeader";
import InscriptionsDrawer from "~/newArch/Ordinals/drawers/Inscriptions";
import { setDrawer } from "~/renderer/drawers/Provider";

const StyledGrid = styled(Grid).attrs(() => ({
  columnGap: 4,
  columns: 4,
  rowGap: 4,
}))`
  grid-template-columns: repeat(4, 1fr);
`;

const Wrapper = styled(Flex)`
  &.disabled {
    pointer-events: none;
  }

  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color ease-in-out 200ms;
  :hover {
    border-color: ${p => p.theme.colors.palette.text.shade20};
  }
  :active {
    border-color: ${p => p.theme.colors.palette.text.shade20};
    background: ${p => p.theme.colors.palette.action.hover};
  }
`;

const InscriptionsGrid = ({ data }: { data: Ordinal[] }) => (
  <StyledGrid flex={1}>
    {data.map((ordinal, i) => {
      const imageUrl = ordinal.metadata.image_original_url;
      const onItemClick = () => {
        console.log("onItemClick", JSON.stringify(ordinal, null, 2));
        setDrawer(
          InscriptionsDrawer,
          {
            name: ordinal.contract.name,
            collectionName: ordinal.name,
            isOpen: true,
          },
          { forceDisableFocusTrap: true },
        );
      };

      return (
        <Flex position="relative" key={i} maxWidth={220}>
          <ItemHeader />
          <Wrapper p={2} borderRadius={6} flexDirection="column" onClick={onItemClick}>
            <Flex borderRadius={6} overflow="hidden">
              <Image
                resource={imageUrl || ""}
                alt={ordinal.contract.name}
                height={200}
                width={200}
              />
            </Flex>
            <Text variant="body" fontWeight="medium" mt={2} mb={1}>
              {ordinal.contract.name || "-"}
            </Text>
            <Text variant="paragraph" fontWeight="medium" color="neutral.c70">
              {ordinal.name || "-"}
            </Text>
          </Wrapper>
        </Flex>
      );
    })}
  </StyledGrid>
);

export default InscriptionsGrid;
