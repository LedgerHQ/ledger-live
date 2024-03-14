import React from "react";
import styled from "styled-components";
import { Flex, Icons } from "@ledgerhq/react-ui";
import InscriptionContextMenu from "./InscriptionContextMenu";
import { Ordinal } from "../../types/Ordinals";

const Container = styled(Flex)`
  align-items: center;
  cursor: pointer;
  padding: 4px;
  color: ${p => p.theme.colors.neutral.c100};
  background-color: ${p => p.theme.colors.neutral.c30};
  border-radius: 8px;
  border: 1px solid ${p => p.theme.colors.neutral.c50};
  &:hover {
    background-color: ${p => p.theme.colors.neutral.c40};
  }
`;

type Props = {
  ordinal: Ordinal;
};

const ItemHeader = ({ ordinal }: Props) => {
  return (
    <Flex
      width={200}
      top={2}
      left={2}
      position="absolute"
      justifyContent="space-between"
      alignItems="center"
      p={3}
    >
      <Flex>
        {/* <Container>
          <Icons.MoreVertical size="M" color="neutral.c100" />
        </Container> */}
      </Flex>
      <Flex>
        <InscriptionContextMenu leftClick={true} inscription={ordinal}>
          <Container>
            <Icons.MoreVertical size="M" color="neutral.c100" />
          </Container>
        </InscriptionContextMenu>
      </Flex>
    </Flex>
  );
};
export default ItemHeader;
