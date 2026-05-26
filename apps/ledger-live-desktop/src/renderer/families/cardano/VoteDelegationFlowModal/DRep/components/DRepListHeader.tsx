import React from "react";
import { Trans } from "react-i18next";

import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";

const Container = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  py: 1,
  flow: 2,
}))`
  font-size: 12px;
  width: 100%;
  background-color: ${p => p.theme.colors.neutral.c30};
`;

const DRepListHeader = () => {
  return (
    <Container>
      <Box width={"60%"} alignItems={"center"}>
        <Text>
          <Trans i18nKey="cardano.voteDelegation.tableHeader.dRep" />
        </Text>
      </Box>
      <Box width={"30%"} alignItems={"left"}>
        <Text>
          <Trans i18nKey="cardano.voteDelegation.tableHeader.lastActiveOn" />
        </Text>
      </Box>
    </Container>
  );
};
export default DRepListHeader;
