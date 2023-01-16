// @flow

import React from "react";
import Box from "~/renderer/components/Box";
import { Flex, Grid } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { Trans } from "react-i18next";
import Text from "~/renderer/components/Text";

const FeaturedButtonContainer = styled(Flex)`
  flex-grow: 1;
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-radius: 4px;
  padding: ${p => p.theme.space[3]}px;
  align-items: center;
  gap: ${p => p.theme.space[3]}px;
`;

const Container = styled(Grid).attrs(() => ({
  columns: 3,
  columnGap: 4,
}))`
  margin-top: ${p => p.theme.space[4]}px;
  margin-bottom: ${p => p.theme.space[6]}px;
`;

const FeaturedButton = ({ title, body }: { title: string, body: string }) => {
  return (
    <FeaturedButtonContainer>
      <div>Icon</div>
      <Box shrink>
        <Text fontSize={4} fontWeight="semiBold" color="palette.neutral.c100" mb="2px">
          {title}
        </Text>
        <Text fontSize={4} fontWeight="medium" color="palette.neutral.c70">
          {body}
        </Text>
      </Box>
    </FeaturedButtonContainer>
  );
};

const FeaturedButtons = () => {
  return (
    <Container>
      <FeaturedButton title="Buy / Sell" body="Buy and sell with trusted providers" />
      <FeaturedButton title="Buy / Sell" body="Buy and sell with trusted providers" />
      <FeaturedButton title="Buy / Sell" body="Buy and sell with trusted providers" />
    </Container>
  );
};
export default FeaturedButtons;
